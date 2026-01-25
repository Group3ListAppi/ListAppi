import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

export const convertImageToBase64 = async (imageUri: string): Promise<string> => {
  try {
    // Jos on jo data URL, palauttaa sellaisenaan
    if (imageUri.startsWith('data:')) {
      console.log('Image is already base64');
      return imageUri;
    }

    console.log('Converting image to base64:', imageUri);

    // Pienennä ja pakkaa kuva ennen base64-muunnosta
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        { resize: { width: 800 } }, // Rajoita leveys 800px:iin
      ],
      {
        compress: 0.5, // Pakkaa 50% laatuun
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    console.log('Image compressed, new URI:', manipulatedImage.uri);

    // Lue kuvatiedosto base64-muodossa
    const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
      encoding: 'base64' as any,
    });

    console.log('Conversion successful, base64 length:', base64.length);
    
    // Tarkista, että base64 ei ole liian suuri (max 900KB turvamarginaalilla)
    if (base64.length > 900000) {
      console.warn('Base64 image is still large:', base64.length, 'bytes');
    }
    
    // Palauttaa data URL:n JPEG-mime-tyypillä
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    return dataUrl;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error; // Heitä virhe eteenpäin käsittelyä varten
  }
};
