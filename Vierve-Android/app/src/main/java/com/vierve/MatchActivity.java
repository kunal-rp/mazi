package com.vierve;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Bundle;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentTransaction;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.widget.Toast;

import com.github.nkzawa.emitter.Emitter;
import com.github.nkzawa.socketio.client.Socket;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.BitmapDescriptor;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MapStyleOptions;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Timer;
import java.util.TimerTask;

public class MatchActivity extends AppCompatActivity implements verification_fragment.OnHeadlineSelectedListener, OnMapReadyCallback {


    private double pu_lat, pu_lng;
    private String rider_user_id, rider_user_name, parker_user_id, parker_user_name;
    private int start_timestamp;


    private Boolean joined_room_confirm = false;

    private GoogleMap mMap;

    //var for the socket
    private Socket mSocket;
    private SocketHandler socketHandler;

    private Marker pu_marker,rider_marker,parker_marker ;


    private double current_lat, current_lng;

    Timer timer;

    verification_fragment verification_fragment;

    private final int DISTANCE_MINIMUM = 10;

    private JSONObject clients = new JSONObject();

    private Db_Helper_User db_helper_user;
    JSONObject current_user;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_match);

        db_helper_user = new Db_Helper_User(this,null);


        socketHandler = new SocketHandler();
        mSocket = socketHandler.getSocket();

        new GPSTracker(MatchActivity.this);


        mSocket.off("joined_room_confirm");
        mSocket.off("issueConfirmation");
        mSocket.off("updateCurrentLocation");
        mSocket.off("revertConfirmation");
        mSocket.off("disconnected");

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
            current_user = db_helper_user.getInfo();
        } catch (JSONException e) {
            e.printStackTrace();
        }


        final match_profile parker_profile = new match_profile();
        Bundle parker_bundle = new Bundle();
        parker_bundle.putString("username", parker_user_name);
        parker_bundle.putString("type", "Parker");
        FragmentManager fm = getSupportFragmentManager();
        parker_profile.setArguments(parker_bundle);
        FragmentTransaction profile_transaction = fm.beginTransaction();
        profile_transaction.replace(R.id.parker_profile, parker_profile, "parker_profile");
        profile_transaction.addToBackStack(null);
        profile_transaction.commit();


        final match_profile rider_profile = new match_profile();
        Bundle rider_bundle = new Bundle();
        rider_bundle.putString("username", rider_user_name);
        rider_bundle.putString("type", "Rider");
        rider_profile.setArguments(rider_bundle);
        FragmentTransaction rider_transaction = fm.beginTransaction();
        rider_transaction.replace(R.id.rider_profile, rider_profile, "rider_profile");
        rider_transaction.addToBackStack(null);
        rider_transaction.commit();


        JSONObject parkerObj = new JSONObject();
        JSONObject riderObj = new JSONObject();
        try {
            parkerObj.put("fragment",parker_profile);
            parkerObj.put("user_name",parker_user_name);
            parkerObj.put("type","park");
            clients.put(parker_user_id,parkerObj);
            riderObj.put("fragment",rider_profile);
            riderObj.put("user_name",rider_user_name);
            riderObj.put("type","rider");
            clients.put(rider_user_id,riderObj);
        } catch (JSONException e) {
            e.printStackTrace();
        }




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
                        if(current_lat != GPSTracker.latitude || current_lng != GPSTracker.longitude){
                            current_lat = GPSTracker.latitude;
                            current_lng = GPSTracker.longitude;
                            JSONObject obj = new JSONObject();
                            try {
                                obj.put("lat", current_lat);
                                obj.put("lng", current_lng);
                                mSocket.emit("updateLocation", obj);
                            } catch (JSONException e) {
                                e.printStackTrace();
                            }
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

                JSONObject userObj = null;
                try {
                    userObj = (JSONObject) clients.get(obj.getString("user_id"));
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        });

        mSocket.on("disconnected", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                JSONObject obj = (JSONObject) args[0];
                Log.d("KTag", "Joined Room : " + obj.toString());

                JSONObject userObj = null;
                try {
                    userObj = (JSONObject) clients.get(obj.getString("user_id"));
                    final JSONObject finalUserObj = userObj;
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                ((match_profile) finalUserObj.get("fragment")).disconnected();
                            } catch (JSONException e) {
                                e.printStackTrace();
                            }
                        }
                    });

                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }
        });


        mSocket.on("issueConfirmation", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                JSONObject obj = (JSONObject) args[0];
                verification_fragment = new verification_fragment();
                Log.d("KTag","confirmation issued");
                Bundle bundle1 = new Bundle();
                try {
                    bundle1.putString("confirmationNumber",obj.getString("confirmationNumber"));
                } catch (JSONException e) {
                    e.printStackTrace();
                }
                verification_fragment.setArguments(bundle1);
                FragmentManager fm = getSupportFragmentManager();
                FragmentTransaction rider_transaction = fm.beginTransaction();
                rider_transaction.replace(R.id.verificationSpace, verification_fragment, "verification_space");
                rider_transaction.addToBackStack(null);
                rider_transaction.commit();
            }
        });

        mSocket.on("revertConfirmation", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                Log.d("KTag", "confirmation reverted");
                Fragment current = getSupportFragmentManager().findFragmentById(R.id.verificationSpace);
                if (current instanceof verification_fragment) {
                    getSupportFragmentManager().beginTransaction().remove(getSupportFragmentManager().findFragmentById(R.id.verificationSpace)).commit();

                }
            }
        });

        mSocket.on("finish", new Emitter.Listener() {
            @Override
            public void call(Object... args) {


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

                            BitmapDescriptor icon;

                            Location pu_location = new Location("pickup");
                            pu_location.setLatitude(pu_lat);
                            pu_location.setLongitude(pu_lng);
                            Location user_location = new Location("user");
                            user_location.setLatitude(t_lat);
                            user_location.setLongitude(t_lng);
                            float distance = pu_location.distanceTo(user_location);
                            Log.d("KTag",obj.getString("user_id")+ " updateLocation");



                            if(obj.getString("user_id").equals(current_user.get("user_id"))){
                                icon = BitmapDescriptorFactory.fromResource(R.drawable.user_marker);

                                if (distance <= 10) {
                                    Log.d("KTag","AtPickup ");
                                    mSocket.emit("atPickup", new JSONObject());
                                } else {
                                    mSocket.emit("notAtPickup", new JSONObject());
                                }
                            }
                            else{
                                icon = BitmapDescriptorFactory.fromResource(R.drawable.other_marker);
                            }


                            JSONObject userObj = (JSONObject) clients.get(obj.getString("user_id"));
                            if(((match_profile)userObj.get("fragment")).getDisconnected()){
                                final JSONObject finalUserObj = userObj;
                                runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() {
                                        try {
                                            ((match_profile) finalUserObj.get("fragment")).connected();
                                        } catch (JSONException e) {
                                            e.printStackTrace();
                                        }
                                    }
                                });
                            }
                            if (distance <= DISTANCE_MINIMUM) {
                                ((match_profile)userObj.get("fragment")).userIsNear();

                            } else {
                                ((match_profile)userObj.get("fragment")).userIsNotNear();
                            }


                            if(userObj.getString("type").equals("ride")){
                                rider_marker.setVisible(true);
                                rider_marker.setIcon(icon);
                                rider_marker.setPosition(new LatLng(t_lat, t_lng));
                            }
                            else{
                                parker_marker.setVisible(true);
                                parker_marker.setIcon(icon);
                                parker_marker.setPosition(new LatLng(t_lat, t_lng));
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
        mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(pickup_loc, 13));

        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED ) {
            return;
        }
        mMap.setMyLocationEnabled(true);

        rider_marker =  mMap.addMarker(new MarkerOptions().position(new LatLng(pu_lat, pu_lng)).visible(false));
        parker_marker =  mMap.addMarker(new MarkerOptions().position(new LatLng(pu_lat, pu_lng)).visible(false));

    }

    @Override
    protected void onDestroy() {
        timer.cancel();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        Toast.makeText(getApplicationContext(),"Cannot Cancel Match",Toast.LENGTH_LONG).show();
    }

    @Override
    public void sendConfirmation() {
        Log.d("KTag","send confirmation");
        mSocket.emit("confirmPickUp", new JSONObject());
    }

    public void startRating() {

    }

}
