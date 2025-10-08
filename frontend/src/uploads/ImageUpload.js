import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useState } from 'react';
import {
  Modal,
  Image,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

export default function ImageUploader({ onUpload, onUploadingChange }) {
  const [imageUris, setImageUris] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);

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

  const takePhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      saveToPhotos: true,
      cameraType: 'back',
      selectionLimit: 1,
    };

    launchCamera(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorCode) {
        console.log('Camera Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const uris = response.assets.map((asset) => asset.uri);
        setImageUris((prev) => [...prev, ...uris]);
        await uploadMultipleToCloudinary(uris);
      }
    });
  };

  const uploadMultipleToCloudinary = async (uris) => {
    setUploading(true);
    if (typeof onUploadingChange === 'function') onUploadingChange(true);
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
  if (typeof onUploadingChange === 'function') onUploadingChange(false);

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
      <View style={styles.singleButtonRow}>
        <TouchableOpacity
          style={[styles.imageButton, uploading ? styles.buttonDisabled : null]}
          onPress={() => setShowPickerModal(true)}
          disabled={uploading}
          activeOpacity={0.8}
        >
          <Text style={styles.imageButtonText}>Pick Image</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showPickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPickerModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Pick Image</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => { setShowPickerModal(false); pickImages(); }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalOptionText}>Choose from library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => { setShowPickerModal(false); takePhoto(); }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalOptionText}>Take photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => setShowPickerModal(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.modalOptionText, styles.modalCancelText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  singleButtonRow: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  imageButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: '#1976D2',
  },
  imageButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  modalOption: { paddingVertical: 14 },
  modalOptionText: { fontSize: 15, color: '#333' },
  modalCancel: { marginTop: 6, borderTopWidth: 1, borderTopColor: '#eee' },
  modalCancelText: { color: '#D32F2F', fontWeight: '700' },
});
