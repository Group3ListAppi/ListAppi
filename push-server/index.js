import express from "express";
import admin from "firebase-admin";

const app = express();
const port = process.env.PORT || 3000;

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON env var");
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountJson);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const processedDocIds = new Set();
const menuRecipeCache = new Map();
const collectionRecipeCache = new Map();
let menuInitialized = false;
let collectionInitialized = false;
let shoplistItemsInitialized = false;
let invitesInitialized = false;

const defaultNotificationSettings = {
  pushEnabled: true,
  pushInvites: true,
  pushUpdates: true,
};

function withListenerRetry(name, startFn, delayMs = 5000) {
  const start = () => {
    try {
      return startFn();
    } catch (error) {
      console.error(`[${name}] start failed`, error);
      setTimeout(start, delayMs);
      return () => null;
    }
  };

  let unsubscribe = start();

  return () => {
    try {
      unsubscribe?.();
    } catch {
      // ignore
    }
  };
}

async function getUserNotificationSettings(userId) {
  const snap = await db
    .collection("users")
    .doc(userId)
    .collection("notificationSettings")
    .doc("preferences")
    .get();

  return {
    ...defaultNotificationSettings,
    ...(snap.exists ? snap.data() : {}),
  };
}

async function shouldSendPush(userId, type) {
  const settings = await getUserNotificationSettings(userId);
  if (!settings.pushEnabled) return false;
  if (type === "invite") return settings.pushInvites !== false;
  if (type === "update") return settings.pushUpdates !== false;
  return true;
}

async function getTokensForUserId(userId) {
  const snap = await db
    .collection("users")
    .doc(userId)
    .collection("notificationTokens")
    .get();

  if (snap.empty) return [];

  const tokens = snap.docs
    .map((doc) => doc.data().token)
    .filter(Boolean);

  return Array.from(new Set(tokens));
}

async function sendPush(tokens, { title, body, data }) {
  if (!tokens.length) return;

  const safeTitle = title || "ListAppi";
  const safeBody = body || "";

  const response = await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title: safeTitle, body: safeBody },
    android: {
      priority: "high",
      notification: {
        channelId: "default",
        title: safeTitle,
        body: safeBody,
      },
    },
    apns: {
      headers: {
        "apns-priority": "10",
      },
    },
    data: {
      ...(data || {}),
      title: safeTitle,
      body: safeBody,
    },
  });

  if (response.failureCount > 0) {
    const failedTokens = [];
    response.responses.forEach((res, idx) => {
      if (!res.success) failedTokens.push(tokens[idx]);
    });

    const cleanupSnaps = await Promise.all(
      failedTokens.map((token) =>
        db
          .collectionGroup("notificationTokens")
          .where("token", "==", token)
          .get()
      )
    );

    await Promise.all(
      cleanupSnaps.flatMap((snap) =>
        snap.docs.map((doc) => doc.ref.delete().catch(() => null))
      )
    );
  }
}

function buildInvitationMessage(invitation, invitationId) {
  const title = "New invitation";
  const body = invitation?.itemName
    ? `You were invited to ${invitation.itemName}`
    : "You have a new invitation";

  return {
    title,
    body,
    data: {
      type: "invitation",
      invitationId,
      itemId: invitation?.itemId ?? "",
      itemType: invitation?.itemType ?? "",
    },
  };
}

async function sendInviteNotification(invitation, invitationId) {
  const toUserId = invitation?.toUserId;
  if (!toUserId) return;

  const allowed = await shouldSendPush(toUserId, "invite");
  if (!allowed) {
    console.log("[invites] disabled by settings", { invitationId, toUserId });
    return;
  }

  const tokens = await getTokensForUserId(toUserId);

  if (!tokens.length) {
    console.log("[invites] no valid tokens", { invitationId, toUserId });
    return;
  }

  console.log("[invites] sending push", {
    invitationId,
    toUserId,
    tokens: tokens.length,
  });

  await sendPush(tokens, buildInvitationMessage(invitation, invitationId));

  await db
    .collection("invitations")
    .doc(invitationId)
    .set(
      {
        notifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  console.log("[invites] push sent", { invitationId, toUserId });
}

function listenForInvites() {
  return withListenerRetry("invites", () =>
    db
      .collection("invitations")
      .onSnapshot(
        (snapshot) => {
          console.log("[invites] snapshot", {
            size: snapshot.size,
            changes: snapshot.docChanges().length,
          });
          if (!invitesInitialized) {
            invitesInitialized = true;
            return;
          }

          snapshot.docChanges().forEach((change) => {
            if (change.type !== "added" && change.type !== "modified") return;

            const doc = change.doc;
            const data = doc.data();

            if (data?.status && data.status !== "pending") {
              console.log("[invites] not pending, skipping", {
                invitationId: doc.id,
                status: data.status,
              });
              return;
            }

            if (data?.notifiedAt) {
              console.log("[invites] already notified, skipping", {
                invitationId: doc.id,
              });
              return;
            }

            if (processedDocIds.has(doc.id)) {
              console.log("[invites] already processed, skipping", {
                invitationId: doc.id,
              });
              return;
            }

            if (!data?.toUserId) {
              console.log("[invites] missing toUserId, skipping", {
                invitationId: doc.id,
              });
              return;
            }

            processedDocIds.add(doc.id);
            sendInviteNotification(data, doc.id).catch((err) => {
              console.error("Failed to send push", err);
            });
          });
        },
        (error) => {
          console.error("[invites] listener error", error);
        }
      )
  );
}

function listenForMenuUpdates() {
  return withListenerRetry("menus", () =>
    db.collection("menulists").onSnapshot(
      (snapshot) => {
        console.log("[menus] snapshot", {
          size: snapshot.size,
          changes: snapshot.docChanges().length,
        });
        if (!menuInitialized) {
          snapshot.docs.forEach((doc) => {
            menuRecipeCache.set(
              doc.id,
              (doc.data().recipes || []).map((r) => r.recipeId)
            );
          });
          menuInitialized = true;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type !== "modified") return;

          const doc = change.doc;
          const data = doc.data();
          const prevRecipeIds = menuRecipeCache.get(doc.id) || [];
          const currentRecipeIds = (data.recipes || []).map((r) => r.recipeId);

          menuRecipeCache.set(doc.id, currentRecipeIds);

          const addedRecipeIds = currentRecipeIds.filter(
            (id) => !prevRecipeIds.includes(id)
          );

          if (!addedRecipeIds.length) {
            console.log("[menus] no recipe additions", { menuId: doc.id });
            return;
          }

          const sharedWith = data.sharedWith || [];
          const ownerId = data.userId;
          if (!sharedWith.length) {
            console.log("[menus] not shared, skipping", { menuId: doc.id });
            return;
          }

          Promise.resolve()
            .then(async () => {
              const recipients = [ownerId, ...sharedWith];

              for (const recipeId of addedRecipeIds) {
                let recipeTitle = "a recipe";
                try {
                  const recipeDoc = await db.collection("recipes").doc(recipeId).get();
                  if (recipeDoc.exists) {
                    recipeTitle = recipeDoc.data()?.title || recipeTitle;
                  }
                } catch {
                  // ignore
                }

                for (const recipientId of recipients) {
                  const allowed = await shouldSendPush(recipientId, "update");
                  if (!allowed) continue;

                  if (data.updatedBy && data.updatedBy === recipientId) {
                    continue;
                  }

                  const tokens = await getTokensForUserId(recipientId);
                  if (!tokens.length) continue;

                  await sendPush(tokens, {
                    title: "Menu updated",
                    body: `${data.name ?? "Menu"}: added ${recipeTitle}`,
                    data: {
                      type: "menu",
                      menuListId: doc.id,
                      recipeId,
                    },
                  });
                }

                console.log("[menus] push sent", {
                  menuId: doc.id,
                  recipeId,
                  recipients: recipients.length,
                });
              }
            })
            .catch((error) => {
              console.error("[menus] handler error", error);
            });
        });
      },
      (error) => {
        console.error("[menus] listener error", error);
      }
    )
  );
}

function listenForCollectionUpdates() {
  return withListenerRetry("collections", () =>
    db.collection("recipeCollections").onSnapshot(
      (snapshot) => {
        console.log("[collections] snapshot", {
          size: snapshot.size,
          changes: snapshot.docChanges().length,
        });
        if (!collectionInitialized) {
          snapshot.docs.forEach((doc) => {
            collectionRecipeCache.set(doc.id, doc.data().recipeIds || []);
          });
          collectionInitialized = true;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type !== "modified") return;

          const doc = change.doc;
          const data = doc.data();
          const prevRecipeIds = collectionRecipeCache.get(doc.id) || [];
          const currentRecipeIds = data.recipeIds || [];

          collectionRecipeCache.set(doc.id, currentRecipeIds);

          const addedRecipeIds = currentRecipeIds.filter(
            (id) => !prevRecipeIds.includes(id)
          );

          if (!addedRecipeIds.length) {
            console.log("[collections] no recipe additions", { collectionId: doc.id });
            return;
          }

          const sharedWith = data.sharedWith || [];
          const ownerId = data.userId;
          if (!sharedWith.length) {
            console.log("[collections] not shared, skipping", { collectionId: doc.id });
            return;
          }

          Promise.resolve()
            .then(async () => {
              const recipients = [ownerId, ...sharedWith];

              for (const recipeId of addedRecipeIds) {
                let recipeTitle = "a recipe";
                try {
                  const recipeDoc = await db.collection("recipes").doc(recipeId).get();
                  if (recipeDoc.exists) {
                    recipeTitle = recipeDoc.data()?.title || recipeTitle;
                  }
                } catch {
                  // ignore
                }

                for (const recipientId of recipients) {
                  const allowed = await shouldSendPush(recipientId, "update");
                  if (!allowed) continue;

                  if (data.updatedBy && data.updatedBy === recipientId) {
                    continue;
                  }

                  const tokens = await getTokensForUserId(recipientId);
                  if (!tokens.length) continue;

                  await sendPush(tokens, {
                    title: "Collection updated",
                    body: `${data.name ?? "Collection"}: added ${recipeTitle}`,
                    data: {
                      type: "recipeCollection",
                      collectionId: doc.id,
                      recipeId,
                    },
                  });
                }

                console.log("[collections] push sent", {
                  collectionId: doc.id,
                  recipeId,
                  recipients: recipients.length,
                });
              }
            })
            .catch((error) => {
              console.error("[collections] handler error", error);
            });
        });
      },
      (error) => {
        console.error("[collections] listener error", error);
      }
    )
  );
}

function listenForShoplistItemAdds() {
  return withListenerRetry("shoplist-items", () =>
    db.collectionGroup("items").onSnapshot(
      (snapshot) => {
        console.log("[shoplist-items] snapshot", {
          size: snapshot.size,
          changes: snapshot.docChanges().length,
        });
        if (!shoplistItemsInitialized) {
          snapshot.docs.forEach((doc) => {
            processedDocIds.add(doc.ref.path);
          });
          shoplistItemsInitialized = true;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;

          const doc = change.doc;
          if (processedDocIds.has(doc.ref.path)) return;
          processedDocIds.add(doc.ref.path);

          const shoplistRef = doc.ref.parent.parent;
          if (!shoplistRef) return;

          Promise.resolve()
            .then(async () => {
              const shoplistDoc = await shoplistRef.get();
              if (!shoplistDoc.exists) return;
              const shoplist = shoplistDoc.data();
              const sharedWith = shoplist.sharedWith || [];
              const ownerId = shoplist.userId;
              if (!sharedWith.length) {
                console.log("[shoplist-items] not shared, skipping", {
                  shoplistId: shoplistRef.id,
                });
                return;
              }

              const recipients = [ownerId, ...sharedWith];
              const itemText = doc.data()?.text || "an item";

              for (const recipientId of recipients) {
                const allowed = await shouldSendPush(recipientId, "update");
                if (!allowed) continue;

                if (doc.data()?.createdBy && doc.data().createdBy === recipientId) {
                  continue;
                }

                const tokens = await getTokensForUserId(recipientId);
                if (!tokens.length) continue;

                await sendPush(tokens, {
                  title: "Shoplist updated",
                  body: `${shoplist.name ?? "Shoplist"}: added ${itemText}`,
                  data: {
                    type: "shoplist",
                    shoplistId: shoplistRef.id,
                    itemId: doc.id,
                  },
                });
              }

              console.log("[shoplist-items] push sent", {
                shoplistId: shoplistRef.id,
                itemId: doc.id,
                recipients: recipients.length,
              });
            })
            .catch((error) => {
              console.error("[shoplist-items] handler error", error);
            });
        });
      },
      (error) => {
        console.error("[shoplist-items] listener error", error);
      }
    )
  );
}

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Push server listening on ${port}`);
  listenForInvites();
  listenForMenuUpdates();
  listenForCollectionUpdates();
  listenForShoplistItemAdds();
});
