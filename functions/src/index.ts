import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";

admin.initializeApp();

export const notifyInvitationCreated = onDocumentCreated(
  "invitations/{invitationId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const invitation = snap.data() as {
      toUserId?: string;
      itemId?: string;
      itemType?: string;
      itemName?: string;
    };

    const toUserId = invitation?.toUserId;
    if (!toUserId) {
      logger.warn("Missing toUserId on invitation", { invitationId: snap.id });
      return;
    }

    const tokensSnap = await admin
      .firestore()
      .collection("users")
      .doc(toUserId)
      .collection("notificationTokens")
      .get();

    if (tokensSnap.empty) {
      logger.info("No notification tokens for user", { toUserId });
      return;
    }

    const tokens = tokensSnap.docs
      .map((doc) => doc.data().token as string | undefined)
      .filter((token): token is string => !!token);

    if (tokens.length === 0) {
      logger.info("No valid tokens found for user", { toUserId });
      return;
    }

    const title = "New invitation";
    const body = invitation?.itemName
      ? `You were invited to ${invitation.itemName}`
      : "You have a new invitation";

    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
      },
      data: {
        type: "invitation",
        invitationId: snap.id,
        itemId: invitation?.itemId ?? "",
        itemType: invitation?.itemType ?? "",
      },
    });

    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((res, idx) => {
        if (!res.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      await Promise.all(
        tokensSnap.docs
          .filter((doc) => failedTokens.includes(doc.data().token))
          .map((doc) => doc.ref.delete().catch(() => null))
      );

      logger.warn("Some notifications failed", {
        failedTokensCount: failedTokens.length,
      });
    }
  }
);
