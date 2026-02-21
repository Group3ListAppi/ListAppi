# 🛒 ListAppi

### Projektin kuvaus

ListAppi on React Native + Expo -pohjainen mobiilisovellus, jonka tarkoituksena on mahdollistaa:

- ostoslistojen hallinta
- reseptien haku
- ruokalistan suunnittelu

Tämä sovellus on osa Mobiilikehitysprojekti-kurssin suoritusta.


### Teknologiat

- React Native
- Expo
- TypeScript
- Firebase Authentication
- Firestore
- TheMealDB API
- AsyncStorage
- React Native Paper


### Sovelluksen päätoiminnot

#### 1. Autentikointi

- Käyttäjä voi rekisteröityä ja kirjautua sisään
- Sähköposti/salasana -kirjautuminen
- Google-kirjautuminen
- Firebase hoitaa salasanojen hashauksen ja istunnonhallinnan

#### 2. Ostoslistat

- Listojen luonti ja muokkaus
- Tuotteiden lisääminen ja poistaminen
- Listojen jakaminen toisille käyttäjille
- Soft delete -ratkaisu (roskakori)

#### 3. Reseptit ja reseptikokoelmat

- Reseptien luonti ja muokkaus
- Reseptien jakaminen toisille käyttäjille
- Soft delete (roskakori)

#### 4. Ruokalistat

- Reseptien liittäminen ruokalistoihin
- Toteutettujen reseptien merkintä
- Soft delete (roskakori)

#### 5. Reseptihaku (TheMealDb)

- Integrointi TheMealDB API:in
- Hakutulosten välimuistitus (TTL-logiikka)
- TheMealDb-reseptien tallennus omiin resepteihin

#### 6. Push-ilmoitukset

- Sovellus tukee push-ilmoituksia
- Ilmoituksia voidaan käyttää käyttäjän informoimiseen sovelluksen tapahtumista


### Projektin rakenne

ListAppi/
│
├── api/          # Ulkoiset API-kutsut (esim. TheMealDB) ja niihin liittyvä logiikka
├── auth/         # Autentikointiin liittyvä logiikka (kirjautuminen, rekisteröinti, ym.)
├── assets/       # Sovelluksessa käytetyt kuvat ja muut staattiset resurssit
├── components/   # Uudelleenkäytettävät UI-komponentit
├── firebase/     # Firebase-konfiguraatio sekä Firestoreen liittyvät toiminnot
├── screens/      # Sovelluksen näkymät (screen-komponentit)
├── types/        # TypeScript-tyypit ja vakioarvot (esim. reseptien suodatus- ja metatiedot)
├── utils/        # Aputoiminnot ja yleiskäyttöiset helper-funktiot
└── App.tsx       # Sovelluksen aloituspiste


### Asennus ja käynnistys

1. Asenna riippuvuudet:

```bash
npm install
```

2. Käynnistä Expo:

```bash
npx expo start
```

3. Lisää oma Firebase konfiguraatio tiedostoon:

```
firebase/config.ts
```