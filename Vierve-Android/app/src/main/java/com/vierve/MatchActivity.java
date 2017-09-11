package com.vierve;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.net.Uri;
import android.os.Bundle;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentTransaction;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import com.github.nkzawa.emitter.Emitter;
import com.github.nkzawa.socketio.client.Socket;
import com.google.android.gms.maps.CameraUpdate;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.BitmapDescriptor;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.Circle;
import com.google.android.gms.maps.model.CircleOptions;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.MapStyleOptions;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.Timer;
import java.util.TimerTask;

public class MatchActivity extends AppCompatActivity implements verification_fragment.OnHeadlineSelectedListener,match_options_fragment.OnHeadlineSelectedListener ,OnMapReadyCallback {


    private double pu_lat, pu_lng;
    private String rider_user_id, rider_user_name, parker_user_id, parker_user_name;
    private int start_timestamp;

    private GoogleMap matchMap;

    //var for the socket
    private Socket mSocket;
    private SocketHandler socketHandler;

    private Marker pu_marker,rider_marker,parker_marker ;

    private boolean manualPickup = false;


    private double current_lat, current_lng;

    Timer timer;

    verification_fragment verification_fragment;

    private final int DISTANCE_MINIMUM = 20;

    private JSONObject clients = new JSONObject();

    private Db_Helper_User db_helper_user;
    JSONObject current_user;

    match_options_fragment match_options_fragment = new match_options_fragment();

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
        parker_profile.disconnected();
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
        rider_profile.disconnected();
        final Bundle rider_bundle = new Bundle();
        rider_bundle.putString("username", rider_user_name);
        rider_bundle.putString("type", "Rider");
        rider_profile.setArguments(rider_bundle);
        FragmentTransaction rider_transaction = fm.beginTransaction();
        rider_transaction.replace(R.id.rider_profile, rider_profile, "rider_profile");
        rider_transaction.addToBackStack(null);
        rider_transaction.commit();

        final FragmentTransaction mo_transaction = fm.beginTransaction();
        mo_transaction.replace(R.id.verificationSpace, match_options_fragment, "match options fragment");
        mo_transaction.addToBackStack(null);
        mo_transaction.commit();


        JSONObject parkerObj = new JSONObject();
        JSONObject riderObj = new JSONObject();
        try {
            parkerObj.put("fragment",parker_profile);
            parkerObj.put("user_name",parker_user_name);
            parkerObj.put("type","park");
            clients.put(parker_user_id,parkerObj);
            riderObj.put("fragment",rider_profile);
            riderObj.put("user_name",rider_user_name);
            riderObj.put("type","ride");
            clients.put(rider_user_id,riderObj);
        } catch (JSONException e) {
            e.printStackTrace();
        }

        Button btn = (Button) findViewById(R.id.zoomFit);
        btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                LatLngBounds.Builder builder = new LatLngBounds.Builder();
                builder.include(parker_marker.getPosition());
                builder.include(rider_marker.getPosition());
                builder.include(pu_marker.getPosition());
                LatLngBounds bounds = builder.build();

                int padding = 20; // offset from edges of the map in pixels
                CameraUpdate cu = CameraUpdateFactory.newLatLngBounds(bounds, padding);
                matchMap.animateCamera(cu);
            }
        });




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


                            Location pu_location = new Location("pickup");
                            pu_location.setLatitude(pu_lat);
                            pu_location.setLongitude(pu_lng);
                            Location user_location = new Location("user");
                            user_location.setLatitude(current_lat);
                            user_location.setLongitude(current_lng);

                            //current distance from the user to the pickup spot
                            float distance = pu_location.distanceTo(user_location);

                            JSONObject obj = new JSONObject();
                            try {
                                obj.put("lat", current_lat);
                                obj.put("lng", current_lng);

                                //if the user is within the minimun distance from the pu spot, it is at the pu spot
                                if (distance <= DISTANCE_MINIMUM || manualPickup == true ) {
                                    obj.put("atPickup", true);
                                } else {
                                    obj.put("atPickup", false);
                                }


                                mSocket.emit("updateLocation", obj);
                            } catch (JSONException e) {
                                e.printStackTrace();
                            }
                        }
                    }
                });
            }
        }, 0, 1000);



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
                                Toast.makeText(getApplicationContext(),"Other User disconnected.\nUser has 1 minute to reconnect",Toast.LENGTH_LONG).show();
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
                FragmentManager fm = getSupportFragmentManager();
                FragmentTransaction mo_transaction = fm.beginTransaction();
                mo_transaction.replace(R.id.verificationSpace, match_options_fragment, "match options fragment");
                mo_transaction.addToBackStack(null);
                mo_transaction.commit();

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
                            Boolean atPickup = obj.getBoolean("atPickup");


                            Location pu_location = new Location("pickup");
                            pu_location.setLatitude(pu_lat);
                            pu_location.setLongitude(pu_lng);
                            Location user_location = new Location("user");
                            user_location.setLatitude(t_lat);
                            user_location.setLongitude(t_lng);

                            //current distance from the user to the pickup spot
                            float distance = pu_location.distanceTo(user_location);

                            JSONObject userObj = (JSONObject) clients.get(obj.getString("user_id"));

                            BitmapDescriptor icon;

                            Log.d("KTag",obj.getString("user_id")+ " updateLocation");

                            //Makes fragment connected for that user of it was previously in disconnected
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

                            //sets the icon
                            if(obj.getString("user_id").equals(current_user.get("user_id"))){
                                icon = BitmapDescriptorFactory.fromResource(R.drawable.user_marker);
                            }
                            else{
                                icon = BitmapDescriptorFactory.fromResource(R.drawable.other_marker);
                            }

                            //updates the marker position
                            if(userObj.getString("type").equals("ride")){
                                rider_marker.setIcon(icon);
                                rider_marker.setPosition(new LatLng(t_lat, t_lng));
                            }
                            else{
                                parker_marker.setIcon(icon);
                                parker_marker.setPosition(new LatLng(t_lat, t_lng));
                            }

                            //updates if it is at the pickup spot or not
                            if (atPickup == true) {
                                if(distance <= DISTANCE_MINIMUM){
                                    ((match_profile)userObj.get("fragment")).userIsNear();
                                }
                                else{
                                    ((match_profile)userObj.get("fragment")).userCantGetAnyCloser();
                                }
                            } else {
                                ((match_profile)userObj.get("fragment")).userIsNotNear();
                            }



                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                        Log.d("KTag","Parker Marker: "+ parker_marker.getPosition());
                        Log.d("KTag","Rider Marker: "+ rider_marker.getPosition());

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

        matchMap = googleMap;
        LatLng pickup_loc = new LatLng(pu_lat, pu_lng);
        MarkerOptions marker_options = new MarkerOptions().position(pickup_loc).title("PicKUp Location");
        pu_marker = matchMap.addMarker(marker_options);
        Circle circle = matchMap.addCircle(new CircleOptions().center(pickup_loc).radius(DISTANCE_MINIMUM).strokeColor(R.color.colorPrimary));
        rider_marker =  matchMap.addMarker(new MarkerOptions().icon(BitmapDescriptorFactory.fromResource(R.drawable.other_marker)).position(new LatLng(pu_lat, pu_lng)));
        parker_marker =  matchMap.addMarker(new MarkerOptions().icon(BitmapDescriptorFactory.fromResource(R.drawable.user_marker)).position(new LatLng(pu_lat, pu_lng)));


        matchMap.setOnMarkerClickListener(new GoogleMap.OnMarkerClickListener() {
            @Override
            public boolean onMarkerClick(Marker marker) {
                return false;
            }
        });

        matchMap.animateCamera(CameraUpdateFactory.newLatLngZoom(pickup_loc, 13));
        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED ) {
            return;
        }
        matchMap.setMyLocationEnabled(true);



    }

    @Override
    protected void onDestroy() {
        timer.cancel();
        mSocket.off("joined_room_confirm");
        mSocket.off("issueConfirmation");
        mSocket.off("updateCurrentLocation");
        mSocket.off("revertConfirmation");
        mSocket.off("disconnected");
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


    @Override
    public void getDirections() {
        String geoUri = "http://maps.google.com/maps?q=loc:" + pu_lat + "," + pu_lng + " (PickUp Location)";
        Intent mapIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(geoUri));
        mapIntent.setPackage("com.google.android.apps.maps");
        if (mapIntent.resolveActivity(getPackageManager()) != null) {
            startActivity(mapIntent);
        }
        else{
            Toast.makeText(getApplicationContext(),"Please install a Maps application",Toast.LENGTH_SHORT).show();
        }
    }



    @Override
    public void manualClose() {
        manualPickup = true;

    }
}
