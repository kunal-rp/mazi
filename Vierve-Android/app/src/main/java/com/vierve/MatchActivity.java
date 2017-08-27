package com.vierve;

import android.content.Intent;
import android.location.Location;
import android.os.Bundle;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentTransaction;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;

import com.github.nkzawa.emitter.Emitter;
import com.github.nkzawa.socketio.client.Socket;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MapStyleOptions;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Timer;
import java.util.TimerTask;

public class MatchActivity extends AppCompatActivity implements OnMapReadyCallback {


    private double pu_lat, pu_lng;
    private String rider_user_id,rider_user_name, parker_user_id,parker_user_name;
    private int start_timestamp;

    private JSONObject user;

    private GoogleMap mMap;

    //var for the socket
    private Socket mSocket;
    private SocketHandler socketHandler;

    private Marker opposite_marker, user_marker, pu_marker;


    private double current_lat, current_lng;

    Timer timer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_match);

        socketHandler = new SocketHandler();
        mSocket = socketHandler.getSocket();

        new GPSTracker(MatchActivity.this);


        mSocket.off("joined_room_confirm");
        mSocket.off("updateCurrentLocation");
        Intent intent = getIntent();
        Bundle bundle = intent.getExtras();
        pu_lat = bundle.getDouble("pu_lat");
        pu_lng = bundle.getDouble("pu_lng");
        rider_user_id = bundle.getString("rider_user_id");
        rider_user_name = bundle.getString("rider_user_name");
        parker_user_id = bundle.getString("parker_user_id");
        parker_user_name = bundle.getString("parker_user_name");
        start_timestamp = bundle.getInt("start_timestamp");
        try {
            user = new JSONObject(bundle.getString("user"));
        } catch (JSONException e) {
            e.printStackTrace();
        }


        final match_profile parker_profile = new match_profile();
        Bundle parker_bundle = new Bundle();
        parker_bundle.putString("username", parker_user_name);
        parker_bundle.putString("type","Parker");
        FragmentManager fm = getSupportFragmentManager();
        parker_profile.setArguments(parker_bundle);
        FragmentTransaction profile_transaction = fm.beginTransaction();
        profile_transaction.replace(R.id.parker_profile, parker_profile, "parker_profile");
        profile_transaction.addToBackStack(null);
        profile_transaction.commit();

        final match_profile rider_profile = new match_profile();
        Bundle rider_bundle = new Bundle();
        rider_bundle.putString("username", rider_user_name);
        rider_bundle.putString("type","Rider");
        rider_profile.setArguments(rider_bundle);
        FragmentTransaction rider_transaction = fm.beginTransaction();
        rider_transaction.replace(R.id.rider_profile, rider_profile, "rider_profile");
        rider_transaction.addToBackStack(null);
        rider_transaction.commit();

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);


        timer = new Timer();
        timer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                            current_lat = GPSTracker.latitude;
                            current_lng = GPSTracker.longitude;
                            Log.d("KTag", "Current Location : " + current_lat + "," + current_lng);
                            JSONObject obj = new JSONObject();
                            try {
                                obj.put("lat", current_lat);
                                obj.put("lng", current_lng);
                                mSocket.emit("updateLocation", obj);
                            } catch (JSONException e) {
                                e.printStackTrace();
                            }


                    }
                });
            }
        }, 0, 500);//put here time 1000 milliseconds=1 secon


        emitJoinRoom();

        mSocket.on("joined_room_confirm", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                JSONObject obj = (JSONObject) args[0];
                Log.d("KTag", "Joined Room : " + obj.toString());
            }
        });

        mSocket.on("updateCurrentLocation", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                final JSONObject obj = (JSONObject) args[0];

                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            Float t_lat = Float.parseFloat(Double.toString(obj.getDouble("lat")));
                            Float t_lng = Float.parseFloat(Double.toString(obj.getDouble("lng")));

                            Location pu_location = new Location("pickup location");
                            pu_location.setLatitude(pu_lat);
                            pu_location.setLongitude(pu_lng);
                            Location user_location = new Location("user");
                            user_location.setLatitude(t_lat);
                            user_location.setLongitude(t_lng);
                            float distance = pu_location.distanceTo(user_location);

                            if(!obj.get("user_id").equals(user.get("user_id"))){
                                if (opposite_marker == null) {
                                    MarkerOptions a = new MarkerOptions().position(new LatLng(t_lat, t_lng)).icon(BitmapDescriptorFactory.fromResource(R.drawable.other_marker));
                                    opposite_marker = mMap.addMarker(a);
                                }
                                else{
                                    opposite_marker.setPosition(new LatLng(t_lat,t_lng));
                                }
                            }
                            else{
                                if (user_marker == null) {
                                    MarkerOptions a = new MarkerOptions().position(new LatLng(t_lat, t_lng)).icon(BitmapDescriptorFactory.fromResource(R.drawable.user_marker));
                                    user_marker = mMap.addMarker(a);
                                }
                                else{
                                   user_marker.setPosition(new LatLng(t_lat,t_lng));
                                }
                            }

                            if(obj.get("user_id").equals(rider_user_id)){
                                if(distance <= 10){
                                    rider_profile.userIsNear();
                                }
                                else{
                                    rider_profile.userIsNotNear();
                                }
                            }else{
                                if(distance <= 10){
                                    parker_profile.userIsNear();
                                }
                                else{
                                    parker_profile.userIsNotNear();
                                }
                            }
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }

                    }
                });
            }
        });
    }


    public void emitJoinRoom() {
        JSONObject obj = new JSONObject();
        try {
            obj.put("rider", rider_user_id);
            obj.put("parker", parker_user_id);
            obj.put("lat", current_lat);
            obj.put("lng", current_lng);
            obj.put("start_timestamp", start_timestamp);
            mSocket.emit("joinRoom", obj);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onMapReady(GoogleMap googleMap) {

        googleMap.setMapStyle(MapStyleOptions.loadRawResourceStyle(this, R.raw.style_json));

        mMap = googleMap;
        LatLng pickup_loc = new LatLng(pu_lat, pu_lng);
        MarkerOptions marker_options = new MarkerOptions().position(pickup_loc).title("PicKUp Location");
        pu_marker = mMap.addMarker(marker_options);
        mMap.moveCamera(CameraUpdateFactory.newLatLng(pickup_loc));
        mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(pickup_loc,13));

    }

    @Override
    protected void onDestroy() {
        timer.cancel();
        super.onDestroy();
    }
}