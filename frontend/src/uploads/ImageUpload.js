import { launchImageLibrary } from 'react-native-image-picker';
import { useState } from 'react';
import {
  Button,
  Image,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

export default function ImageUploader({ onUpload }) {
  const [imageUris, setImageUris] = useState([]);
  const [uploading, setUploading] = useState(false);

  const pickImages = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      selectionLimit: 0, // ✅ allows multiple selection
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const uris = response.assets.map((asset) => asset.uri);
        setImageUris((prev) => [...prev, ...uris]);
        await uploadMultipleToCloudinary(uris);
      }
    });
  };

  const uploadMultipleToCloudinary = async (uris) => {
    setUploading(true);
    const uploadedUrls = [];

    for (const uri of uris) {
      const formData = new FormData();
      formData.append('file', {
        uri: uri.startsWith('file://') ? uri : 'file://' + uri,
        type: 'image/jpeg',
        name: 'upload.jpg',
      });
      formData.append('upload_preset', 'gteb9uxc'); // your Cloudinary preset

      try {
        const res = await fetch(
          'https://api.cloudinary.com/v1_1/dgeeg9jao/image/upload',
          {
            method: 'POST',
            body: formData,
          }
        );
        const data = await res.json();
        console.log('Uploaded:', data.secure_url);
        uploadedUrls.push(data.secure_url);
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    setUploading(false);

    // ✅ Send all uploaded URLs to parent
    if (onUpload) {
      onUpload((prevUrls = []) => [...prevUrls, ...uploadedUrls]);
    }
  };

  // ✅ Remove image locally + from parent form
  const removeImage = (index) => {
    const updated = imageUris.filter((_, i) => i !== index);
    setImageUris(updated);
    if (onUpload) {
      onUpload((prevUrls = []) => prevUrls.filter((_, i) => i !== index));
    }
  };

  return (
    <View>
      <Button
        title={uploading ? 'Uploading...' : 'Pick Images'}
        onPress={pickImages}
        disabled={uploading}
      />

      {uploading && (
        <View style={{ marginTop: 10 }}>
          <ActivityIndicator size="small" />
          <Text>Uploading images...</Text>
        </View>
      )}

      {imageUris.length > 0 && (
        <ScrollView horizontal style={{ marginTop: 10 }}>
          {imageUris.map((uri, index) => (
            <View key={index} style={styles.imageContainer}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeImage(index)}
              >
                <Text style={styles.removeText}>✖</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {imageUris.length > 0 && (
        <Text style={{ marginTop: 5 }}>{imageUris.length} image(s) selected</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  removeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
