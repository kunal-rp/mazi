package com.vierve;

import android.Manifest;
import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.annotation.TargetApi;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.AsyncTask;
import android.os.Build;
import android.os.CountDownTimer;
import android.support.annotation.NonNull;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentTransaction;
import android.support.v4.content.ContextCompat;
import android.support.v4.content.LocalBroadcastManager;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.support.v7.widget.Toolbar;
import android.util.JsonReader;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.Toast;

import com.github.nkzawa.emitter.Emitter;
import com.github.nkzawa.socketio.client.IO;
import com.github.nkzawa.socketio.client.Socket;
import com.google.android.gms.maps.CameraUpdate;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.Circle;
import com.google.android.gms.maps.model.CircleOptions;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.MapStyleOptions;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URISyntaxException;
import java.net.URL;
import java.security.Key;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Timer;
import java.util.TimerTask;
import java.util.logging.Handler;

import javax.crypto.spec.SecretKeySpec;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;


public class MainActivity extends AppCompatActivity implements parking_fragment.OnHeadlineSelectedListener, college_fragment.OnHeadlineSelectedListener, pickup_fragment.OnHeadlineSelectedListener, OnMapReadyCallback {

    /*

    The Launcher Activity
    User picks the college and the request type
     */


    //var for the socket
    private Socket mSocket;

    //holds all of user's details that is passed along to other activites
    private JSONObject user;

    //used to make socket universal throughout all acivites
    private SocketHandler socketHandler;


    //var used to saved version data from REST API
    private JSONObject version_data;

    final static double METERS_IN_MILE = 1609.34;


    private GoogleMap mMap;

    //Progress Circle Objects
    private View mProgressView;


    //local db to store data for college and parking lot data
    //Future use : hold user credential data
    private DB_Helper_Data db_helper_data;

    private Db_Helper_User db_helper_user;

    //holds all of the markers to be shown on the map
    private ArrayList<Marker> markers = new ArrayList<>();

    //holds the college id,lat,lng of the current college id
    public String selected_college_id;
    public String selected_parkinglot_id;
    public String type;

    //holds the pick up location for the request
    public Float pu_lat;
    public Float pu_lng;


    //hodls user's current coordinates
    private double current_lat, current_lng, college_lat, college_lng;
    private double ride_limit, park_limit;

    college_fragment college_fragment;
    parking_fragment parking_fragment;

    private boolean finishedSetUp = false;

    private JSONObject eventData;


    //connects to the server
    {
        try {
            socketHandler = new SocketHandler();
            mSocket = IO.socket(socketHandler.getURL());

        } catch (URISyntaxException e) {
            Log.i("Socket", "Invalid URI");
            Toast.makeText(this, "No Connection", Toast.LENGTH_SHORT).show();
        }
        //need to handle exception where connection not made
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        MyLogger.d("KTag", "Main Activity onCreate");



        user = new JSONObject();

        //Initializes local db
        db_helper_data = new DB_Helper_Data(this, null);
        db_helper_user = new Db_Helper_User(this, null);
        try {
            user = db_helper_user.getInfo();
        } catch (JSONException e) {
            e.printStackTrace();
        }

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);

        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        toolbar.setOverflowIcon(ContextCompat.getDrawable(getApplicationContext(), R.drawable.ic_settings_icon));


        ImageView profile = (ImageView) findViewById(R.id.profile);
        profile.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(getApplicationContext(), UserOverviewActivity.class);
                startActivity(intent);
            }
        });


        mSocket.off("updateStatus");


        mSocket.on("updateStatus", new Emitter.Listener() {
            @Override
            public void call(Object... args) {

                JSONObject obj = (JSONObject) args[0];
                MyLogger.d("KTag", "Status Update : " + obj.toString());
                try {
                    user.put("status", obj.getString("status"));
                } catch (JSONException e) {
                    e.printStackTrace();
                }
                checkStatus(obj);
            }
        });

        mSocket.on("ping", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        mSocket.emit("pong", "pong");
                    }
                });
            }
        });


    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_mainacivity, menu);
        return true;
    }

    /*
       Sets up the map
       When a marker is clicked, the markers title (i.e. Parking Lot A) is used to correlate the marker with the value in the spinner
       Spinner then changes value accordingly to match the marker clicked
        */
    public void onMapReady(GoogleMap googleMap) {
        mProgressView = findViewById(R.id.progress_view);
        showProgress(true);
        new GPSTracker(MainActivity.this);
        googleMap.setMapStyle(MapStyleOptions.loadRawResourceStyle(this, R.raw.style_json));
        mMap = googleMap;
        mMap.getUiSettings().setMyLocationButtonEnabled(false);
        LatLng college_selected = new LatLng(27.380469, 33.632096);
        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(college_selected, 18));
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED || ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Toast.makeText(getApplicationContext(),"Need Location Access",Toast.LENGTH_LONG).show();
            finish();
        }
        mMap.setMyLocationEnabled(true);
        mMap.setOnMapLoadedCallback(new GoogleMap.OnMapLoadedCallback() {
            @Override
            public void onMapLoaded() {
                new EstablishWebSocket().execute();
                mMap.setOnMarkerClickListener(new GoogleMap.OnMarkerClickListener() {
                    @Override
                    public boolean onMarkerClick(Marker marker) {
                        for(int i = 0; i < markers.size(); i++){
                            markers.get(i).setIcon(BitmapDescriptorFactory.fromResource(R.drawable.other_marker));
                        }
                        marker.setIcon(BitmapDescriptorFactory.fromResource(R.drawable.user_marker));
                        mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(marker.getPosition(), 17));
                        parking_fragment.updateSpinnerSelected(marker.getTitle());
                        return false;
                    }
                });
            }
        });

    }



    /*
    Async Task
    Connects to the server and establishes the websocket connection
     */
    private class EstablishWebSocket extends AsyncTask<JSONObject, Void, Void> {

        @Override
        protected Void doInBackground(JSONObject... params) {
            mSocket.connect();
            socketHandler.setSocket(mSocket);
            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            new MainActivity.SetUser().execute();
            super.onPostExecute(aVoid);
        }
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        switch (item.getItemId()){
            case R.id.log_off:
                db_helper_user.clearAllTables();
                finish();
                break;
            case R.id.sug_report:
                Intent intent = new Intent(getApplicationContext(),SuggestionBugActivity.class);
                startActivity(intent);
                break;
        }

        return true;
    }

    /*
        Async Task
        Emits the set user event, which correlates socket connection with the user id
        For now, random user_id is generated by random number and converted to hex
        */
    private class SetUser extends AsyncTask<JSONObject, Void, Void> {
        @Override
        protected Void doInBackground(JSONObject... params) {

            MyLogger.d("KTag", "Set User Event Called");

            try {
                user = db_helper_user.getInfo();

                user.put("user_id", user.get("user_id"));
                user.put("user_name", user.get("user_name"));
                mSocket.emit("setUser", user);
                finishedSetUp = true;


            } catch (JSONException e) {
                e.printStackTrace();
            }
            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            MyLogger.d("KTag","User Key:"+socketHandler.getUserKey());
            new MainActivity.GetVersionData().execute();
        }
    }

    /*
   Async task that calles REST API to first get the current data version number from db_helper_data
   Then passes that into the 'checkVersion' URL
    */
    private class GetVersionData extends AsyncTask<Object, Object, Void> {

        byte[] encodeUserID = new String(socketHandler.getDefaultKey()).getBytes();
        byte[] encodeData = new String(socketHandler.getUserKey()).getBytes();
        Key key_userid = new SecretKeySpec(encodeUserID, SignatureAlgorithm.HS256.getJcaName());
        Key key_data = new SecretKeySpec(encodeData, SignatureAlgorithm.HS256.getJcaName());

        @Override
        protected Void doInBackground(Object... args) {
            try {

                String token_user = Jwts.builder().claim("user_id",user.getString("user_id")).signWith(SignatureAlgorithm.HS256, key_userid).compact();

                String token_data = Jwts.builder().claim("ver",db_helper_data.getAllCollegeVersion()).signWith(SignatureAlgorithm.HS256, key_data).compact();
                //REST API url ; calls db method to get the largest verison
                String urlstring = socketHandler.getURL() + "/checkVersion";
                MyLogger.d("KTag", Integer.toString(db_helper_data.getAllCollegeVersion()));
                MyLogger.d("KTag", "GetVersionData REST API check");
                URL versionUrl = new URL(urlstring);
                HttpURLConnection myConnection = (HttpURLConnection) versionUrl.openConnection();
                myConnection.setRequestProperty("user_type", "vierve_android");
                myConnection.setRequestProperty("token_user", token_user);
                myConnection.setRequestProperty("token_data", token_data);
                if (myConnection.getResponseCode() == 200) {
                    InputStream responseBody = myConnection.getInputStream();
                    InputStreamReader responseBodyReader = new InputStreamReader(responseBody, "UTF-8");
                    JsonReader jsonReader = new JsonReader(responseBodyReader);
                    String var = getStringFromInputStream(responseBody);
                    version_data = new JSONObject(var);
                    MyLogger.d("KTag", "Sucsessful http REST API");

                } else {
                    MyLogger.d("KTag", "Error");
                }

            } catch (IOException e) {
                Toast.makeText(getApplicationContext(),"Cannot establish connection to Server for Check Version",Toast.LENGTH_LONG).show();
                e.printStackTrace();
            } catch (JSONException e) {
                Toast.makeText(getApplicationContext(),"Can't put Check Verison results into JSON Object",Toast.LENGTH_LONG).show();
                e.printStackTrace();
            }
            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {

            new CheckVersion().execute();
        }
    }

    //Method to get the results from the API into a String
    private static String getStringFromInputStream(InputStream is) {

        BufferedReader br = null;
        StringBuilder sb = new StringBuilder();

        String line;
        try {

            br = new BufferedReader(new InputStreamReader(is));
            while ((line = br.readLine()) != null) {
                sb.append(line);
            }

        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            if (br != null) {
                try {
                    br.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }

        return sb.toString();

    }

    /*
    Async Task
    Uses the results from the REST API to determine whether to update the local db with the correct information or to move along
     */
    private class CheckVersion extends AsyncTask<Object, Object, Void> {

        int code;
        String message;

        @Override
        protected Void doInBackground(Object... params) {

            try {
                code = version_data.getInt("code");

            } catch (JSONException e) {
                Toast.makeText(getApplicationContext(),"No Results from Check version",Toast.LENGTH_LONG).show();
                e.printStackTrace();
            }
            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            if (code == 2) {
                //in case version data is not up to date
                MyLogger.d("KTag", "checkVersion : New Data");
                new PushNewData().execute();
            } else if (code == 1) {
                //in case local db had up to date data
                MyLogger.d("KTag", "checkVersion : NO New Data");
                new GetEvents().execute();
            }
            else if(code == 0){
                try {
                    showProgress(false);
                    message = version_data.getString("message");
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            Toast.makeText(getApplicationContext(), message, Toast.LENGTH_LONG).show();
                        }
                    });
                } catch (JSONException e) {
                    e.printStackTrace();
                }

            }
        }
    }

    /*
    Async Task
    Called when local data is not up to date
     */
    private class PushNewData extends AsyncTask<Object, Object, Void> {
        @Override
        protected Void doInBackground(Object... args) {

            MyLogger.d("KTag", "PushNewData");
            //first will clear all of the data from both local db tables for colleges and parking
            db_helper_data.clearAllTables();

            try {
                //breaks up college data and parking data into vars
                JSONObject college_data = version_data.getJSONObject("college_data");
                JSONObject parking_data = version_data.getJSONObject("parking_data");

                //parses array of ids to get all of the college data
                JSONArray college_ids = college_data.getJSONArray("ids");

                //pushes data from college into the local db table for colleges
                for (int i = 0; i < college_ids.length(); i++) {
                    int num = college_ids.getInt(i);
                    db_helper_data.addCollege(num, college_data.getJSONObject(Integer.toString(num)));
                }

                //parses array of ids to get all of the parking data
                JSONArray parkinglot_ids = parking_data.getJSONArray("ids");

                //pushes data from college into the local db table for parking
                for (int i = 0; i < parkinglot_ids.length(); i++) {
                    int num = parkinglot_ids.getInt(i);
                    db_helper_data.addParkingLot(num, parking_data.getJSONObject(Integer.toString(num)));
                }

            } catch (JSONException e) {
                e.printStackTrace();
            }

            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            new GetEvents().execute();
        }
    }

    /*
    Clears the map of all markers and adds the fragment to the view
     */
    public void startCollegeFragment() {
        showProgress(false);
        mMap.clear();
        markers.clear();

        current_lat = GPSTracker.latitude;
        current_lng = GPSTracker.longitude;

        MyLogger.d("KTag",current_lat+","+current_lng  +" | "+ Calendar.getInstance().getTimeInMillis() +" . " +GPSTracker.time );


        Bundle bundle = new Bundle();
        bundle.putDouble("current_lat",current_lat);
        bundle.putDouble("current_lng",current_lng);
        bundle.putString("json",eventData.toString());
        MyLogger.d("KTag","Location Main:"+current_lat + ","+current_lng);
        college_fragment = new college_fragment();
        college_fragment.setArguments(bundle);
        FragmentManager fm = getSupportFragmentManager();
        FragmentTransaction transaction = fm.beginTransaction();
        transaction.replace(R.id.contentFragment, college_fragment);
        transaction.commit();

    }
    @Override
    protected void onSaveInstanceState(Bundle outState) {
        //No call for super(). Bug on API Level > 11.
    }


    //Moves map focus when a new spinner item is clicked for the college_fragment
    @Override
    public void onCollegeSpinnerItemSelected(float lat, float lng,float ridel,float parkl, String college_id) {
        mMap.clear();
        college_lat = lat;
        college_lng = lng;
        ride_limit = ridel;
        park_limit = parkl;
        MyLogger.d("KTag","College Selected: "+ college_lat + ","+ college_lng + " | Ride Limits : "+ ride_limit + ","+park_limit);
        LatLng college = new LatLng(lat, lng);
        mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(college, 14));
        selected_college_id = college_id;
    }

    /*
    Handles when user clicks one of the action buttons on the college_fragment
    Will first check to make sure all necessary permissions are avalible
    Future Use : then will check location of user
     */
    @Override
    public void onPRActionRequest(String t) {
            mMap.clear();
            current_lat = GPSTracker.latitude;
            current_lng = GPSTracker.longitude;
            MyLogger.d("KTag","PR:"+current_lat+","+current_lng);

            type=t;
            Location college = new Location("college");
            college.setLatitude(college_lat);
            college.setLongitude(college_lng);
            Location user_location = new Location("user");
            user_location.setLatitude(current_lat);
            user_location.setLongitude(current_lng);
            float distance = college.distanceTo(user_location);

            if((type.equals("ride") && distance > (ride_limit * METERS_IN_MILE)) || (type.equals("park") && distance > (park_limit * METERS_IN_MILE)) ){
                Toast.makeText(this,"User is too far away from college.\nUser needs to be in the circle" ,Toast.LENGTH_SHORT).show();
                Circle circle;
                if((type.equals("ride") && distance > (ride_limit * METERS_IN_MILE))){

                    circle = mMap.addCircle(new CircleOptions()
                            .center(new LatLng(college_lat, college_lng))
                            .radius(ride_limit * METERS_IN_MILE)
                            .strokeColor(R.color.colorPrimary));
                    }
                else{
                    circle = mMap.addCircle(new CircleOptions()
                            .center(new LatLng(college_lat, college_lng))
                            .radius(park_limit * METERS_IN_MILE)
                            .strokeColor(R.color.colorPrimary));
                }

                LatLngBounds.Builder builder = new LatLngBounds.Builder();
                builder.include(new LatLng(current_lat,current_lng));
                builder.include(circle.getCenter());
                LatLngBounds bounds = builder.build();

                int padding = 20; // offset from edges of the map in pixels
                CameraUpdate cu = CameraUpdateFactory.newLatLngBounds(bounds, padding);
                mMap.animateCamera(cu);
            }
            else{
                try {
                    user.put("type",type);
                    startParkingFragment(selected_college_id);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
            }

    }

    @Override
    public void focusCurrentPosition() {
        current_lat = GPSTracker.latitude;
        current_lng = GPSTracker.longitude;
        LatLng current_loc = new LatLng(current_lat, current_lng);
        mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(current_loc, 20));

    }

    /*
    Sequentially occurs after the college fragment
    Gets the college id and passes it to the fragment
    replaces college_fragment with parking_fragment
     */
    public void startParkingFragment(String selected_college_id) {
        parking_fragment = new parking_fragment();
        FragmentManager fm = getSupportFragmentManager();
        Bundle bundle = new Bundle();
        bundle.putString("selected_college_id", selected_college_id);
        parking_fragment.setArguments(bundle);
        FragmentTransaction transaction = fm.beginTransaction();
        transaction.replace(R.id.contentFragment, parking_fragment, "parking_fragment");
        transaction.addToBackStack(null);
        transaction.commit();


    }


    //Sets the markers on the map for the parking_fragment
    @Override
    public void setMarkers(ArrayList<MarkerOptions> marker, ArrayList<String> list) {
        markers.clear();
        for (int i = 0; i < marker.size(); i++) {
            Marker temp = mMap.addMarker(marker.get(i));
            markers.add(temp);
        }
    }


    /*
    Gets the parking lot id and passes it on to the next fragment / activity
     */
    @Override
    public void setParkingLot(String selected) {
        selected_parkinglot_id = selected;
        if (type.equals("ride")) {
            startPickupFragment();
        } else {
            submitRequest();
        }
    }


    //Moves map focus when a new spinner item is clicked for the parking_fragment
    @Override
    public void onParkingSpinnerItemSelected(float lat, float lng,int index) {

        for(int i = 0; i < markers.size(); i++){
            markers.get(i).setIcon(BitmapDescriptorFactory.fromResource(R.drawable.other_marker));
        }
        markers.get(index).setIcon(BitmapDescriptorFactory.fromResource(R.drawable.user_marker));
        mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(markers.get(index).getPosition(), 17));
    }

    /*
    Sequentially would occur after the parking_fragment
    In the case that the "Ride" Action button is clicked, the location of the pick up is requested
     */
    public void startPickupFragment() {
        mMap.clear();

        current_lat = GPSTracker.latitude;
        current_lng = GPSTracker.longitude;
        LatLng current_loc = new LatLng(current_lat, current_lng);
        mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(current_loc, 20));

        Circle circle = mMap.addCircle(new CircleOptions()
                .center(new LatLng(college_lat, college_lng))
                .radius(ride_limit * METERS_IN_MILE)
                .strokeColor(R.color.colorPrimary));
        pickup_fragment pickup_fragment = new pickup_fragment();
        FragmentManager fm = getSupportFragmentManager();
        FragmentTransaction transaction = fm.beginTransaction();
        transaction.replace(R.id.contentFragment, pickup_fragment, "pickup_fragment");
        transaction.addToBackStack(null);
        transaction.commit();
    }

    //Gets the paramenter latitude and longitude and passes it to the waiting activity as the pick up coordinates
    @Override
    public void setPickupLocation(Float lat, Float lng) {
        pu_lat = lat;
        pu_lng = lng;

        Location college = new Location("college");
        college.setLatitude(college_lat);
        college.setLongitude(college_lng);
        Location pu_loc = new Location("pu_loc");
        pu_loc.setLatitude(pu_lat);
        pu_loc.setLongitude(pu_lng);
        float distance = college.distanceTo(pu_loc);
        if(distance > (ride_limit * METERS_IN_MILE)){
            Toast.makeText(this,"Pick Up Location is too far away from college" ,Toast.LENGTH_SHORT).show();
        }
        else{
            MyLogger.d("KTag", Double.toString(lat) + " " + Double.toString(lng));
            submitRequest();
        }

    }

    /*
    returns corrdinates for middle of the screen map
    used for pickup_fragment
     */
    public LatLng getCenterLocationCoordinates() {
        return mMap.getCameraPosition().target;
    }


    /*
    Sequentially occurs after the Main Activity
    After all of the necessary datat fro a Park or Ride Request is recieved, the waiting activity is called
    All of the necessary information to make the request is passed to the activity
     */
    public void submitRequest() {
        JSONObject obj = new JSONObject();
        try {
            obj.put("college_id", selected_college_id);
            obj.put("parkinglot_id",selected_parkinglot_id);
            obj.put("type",type);
            obj.put("pickup_lat",pu_lat);
            obj.put("pickup_lng",pu_lng);
            mSocket.emit("register",obj);
            MyLogger.d("KTag","Register Event : "+ obj.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }
        startCollegeFragment();
        showProgress(true);
    }

    public void startWaitingActivity(String college_id, String parkinglot_id, String client_type){
        MyLogger.d("KTag","Start Waiting Activity");
        Intent intent = new Intent(this, Waiting_Activity.class);
        intent.putExtra("selected_college_id", college_id);
        intent.putExtra("selected_parkinglot_id", parkinglot_id);
        intent.putExtra("type", client_type);
        startActivity(intent);
    }

    public void startMatchActivity(JSONObject obj) throws JSONException {
        Intent intent = new Intent(this, MatchActivity.class);
        MyLogger.d("KTag","Match : "+ obj.toString());
        intent.putExtra("pu_lat",obj.getDouble("pu_lat"));
        intent.putExtra("pu_lng", obj.getDouble("pu_lng"));
        intent.putExtra("rider_user_id", (String) obj.getString("rider_user_id"));
        intent.putExtra("rider_user_name", (String) obj.getString("rider_user_name"));
        intent.putExtra("parker_user_id", (String) obj.getString("parker_user_id"));
        intent.putExtra("parker_user_name", (String) obj.getString("parker_user_name"));
        intent.putExtra("start_timestamp", (Integer) obj.getInt("start_timestamp"));
        startActivity(intent);
    }

    public void startRatingActivity(JSONObject obj){
        Intent intent = new Intent(this, RatingActivity.class);
        try {

            intent.putExtra("user_id",user.getString("user_id"));
            intent.putExtra("rider_user_id",obj.getString("rider_user_id"));
            intent.putExtra("rider_user_name",obj.getString("rider_user_name"));
            intent.putExtra("parker_user_id",obj.getString("parker_user_id"));
            intent.putExtra("parker_user_name",obj.getString("parker_user_name"));
            intent.putExtra("match_end_type",obj.getString("match_end_type"));
        } catch (JSONException e) {
            e.printStackTrace();
        }

        startActivity(intent);
    }


    @Override
    protected void onResume() {
        socketHandler.stopTimer();
        FragmentManager fm = this.getSupportFragmentManager();
        for(int i = 0; i < fm.getBackStackEntryCount(); ++i) {
            fm.popBackStack();
        }
        try {
            if(user.get("status") != null && finishedSetUp == true){
                MyLogger.d("KTag","getUserStatus on Resume");
                mSocket.emit("getUserStatus", new JSONObject());
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }

        super.onResume();


    }

    @Override
    public void onBackPressed() {
        Fragment current = getSupportFragmentManager().findFragmentById(R.id.contentFragment);
        if (current instanceof parking_fragment) {
            mMap.clear();
            markers.clear();
        }
        super.onBackPressed();
    }

    //Socket Connection is disconnected after the activity cancels out to the login activity
    @Override
    protected void onDestroy() {
        MyLogger.d("KTag","Main Activity Destroyed");
        socketHandler.stopTimer();
        mSocket.disconnect();
        super.onDestroy();
    }

    private void checkStatus(JSONObject obj){
        try {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    showProgress(false);
                }
            });
            if(obj.getString("status").equals("waiting_match")){
                startWaitingActivity(obj.getString("selected_college"),obj.getString("selected_parkinglot"),obj.getString("client_type"));
            }
            else if(obj.get("status").equals("matched")){
                startMatchActivity(obj);
            }
            else if(obj.get("status").equals("finish")){
                startRatingActivity(obj);
            }

        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    /**
     * Shows the progress UI and hides the login form.
     */
    @TargetApi(Build.VERSION_CODES.HONEYCOMB_MR2)
    private void showProgress(final boolean show) {
        // On Honeycomb MR2 we have the ViewPropertyAnimator APIs, which allow
        // for very easy animations. If available, use these APIs to fade-in
        // the progress spinner.

        final FrameLayout contentFrag = (FrameLayout) findViewById(R.id.contentFragment);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB_MR2) {
            int shortAnimTime = getResources().getInteger(android.R.integer.config_shortAnimTime);

            contentFrag.setVisibility(show ? View.GONE : View.VISIBLE);
            contentFrag.animate().setDuration(shortAnimTime).alpha(
                    show ? 0 : 1).setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    contentFrag.setVisibility(show ? View.GONE : View.VISIBLE);
                }
            });

            mProgressView.setVisibility(show ? View.VISIBLE : View.GONE);
            mProgressView.animate().setDuration(shortAnimTime).alpha(
                    show ? 1 : 0).setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    mProgressView.setVisibility(show ? View.VISIBLE : View.GONE);
                }
            });
        } else {
            // The ViewPropertyAnimator APIs are not available, so simply show
            // and hide the relevant UI components.
            mProgressView.setVisibility(show ? View.VISIBLE : View.GONE);
            contentFrag.setVisibility(show ? View.GONE : View.VISIBLE);
        }
    }

    /*
 Async task that calles REST API to first get the current data version number from db_helper_data
 Then passes that into the 'checkVersion' URL
  */
    private class GetEvents extends AsyncTask<Object, Object, Void> {


        JSONObject resultJSON;

        byte[] encodedKey = new String(socketHandler.getDefaultKey()).getBytes();
        Key k = new SecretKeySpec(encodedKey, SignatureAlgorithm.HS256.getJcaName());

        protected Void doInBackground(Object... args) {
            try {
                String token = Jwts.builder().claim("name","name").signWith(SignatureAlgorithm.HS256, k).compact();

                String urlstring = socketHandler.getURL() + "/getEvents";
                MyLogger.d("KTag",urlstring);
                MyLogger.d("KTag", "GetEvents REST API check");
                URL versionUrl = new URL(urlstring);
                HttpURLConnection myConnection = (HttpURLConnection) versionUrl.openConnection();
                myConnection.setRequestProperty("user_type", "vierve_android");
                myConnection.setRequestProperty("token", token);
                if (myConnection.getResponseCode() == 200) {
                    InputStream responseBody = myConnection.getInputStream();
                    InputStreamReader responseBodyReader = new InputStreamReader(responseBody, "UTF-8");
                    JsonReader jsonReader = new JsonReader(responseBodyReader);
                    String var = getStringFromInputStream(responseBody);
                    MyLogger.d("KTag",var);
                    resultJSON = new JSONObject(var);
                    MyLogger.d("KTag", "Sucsessful http REST API");
                    MyLogger.d("KTag", "JSON Response Object : " +resultJSON.toString());
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            MyLogger.d("KTag","GetEvents:"+resultJSON.toString());
                            new MainActivity.SetEventData().execute(resultJSON);
                        }
                    });

                } else {
                    MyLogger.d("KTag", Integer.toString(myConnection.getResponseCode()));
                }

            } catch (IOException e) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(getApplicationContext(),"Cannot establish connection to Server for Check User",Toast.LENGTH_LONG).show();

                    }
                });
                e.printStackTrace();
            } catch (JSONException e) {
                runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Toast.makeText(getApplicationContext(),"Can't put Check User results into JSON Object",Toast.LENGTH_LONG).show();
                    }
                });
                e.printStackTrace();
            }
            return null;
        }
    }

    /*
    Async Task
    Uses the results from the REST API to determine whether to update the local db with the correct information or to move along
     */
    private class SetEventData extends AsyncTask<Object, Object, Void> {


        @Override
        protected Void doInBackground(Object... args) {
            eventData = (JSONObject) args[0];

            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            startCollegeFragment();
        }
    }





}
