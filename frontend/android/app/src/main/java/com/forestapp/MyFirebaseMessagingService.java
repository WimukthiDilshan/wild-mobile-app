package com.forestapp;

import android.util.Log;
import androidx.annotation.NonNull;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "MyFMService";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        Log.i(TAG, "onMessageReceived: " + remoteMessage);
        if (remoteMessage.getNotification() != null) {
            Log.i(TAG, "Notification title=" + remoteMessage.getNotification().getTitle() + " body=" + remoteMessage.getNotification().getBody());
        }
        if (remoteMessage.getData() != null && !remoteMessage.getData().isEmpty()) {
            Log.i(TAG, "Data payload=" + remoteMessage.getData().toString());
        }
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.i(TAG, "onNewToken: " + token);
    }
}
