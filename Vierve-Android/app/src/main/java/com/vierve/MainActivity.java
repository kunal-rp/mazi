package com.vierve;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.AsyncTask;
import android.support.annotation.NonNull;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentTransaction;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.JsonReader;
import android.util.Log;
import android.view.View;
import android.widget.Button;
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
import java.util.ArrayList;


public class MainActivity extends AppCompatActivity implements parking_fragment.OnHeadlineSelectedListener, college_fragment.OnHeadlineSelectedListener, pickup_fragment.OnHeadlineSelectedListener, OnMapReadyCallback {

    //var for the socket
    private Socket mSocket;

    //holds all of user's details that is passed along to other activites
    private JSONObject user;

    //used to make socket universal throughout all acivites
    private SocketHandler socketHandler;
    String krpURL = "http://192.168.5.135:3000";

    //var used to saved version data from REST API
    private JSONObject version_data;

    final static double METERS_IN_MILE = 1609.34;


    private GoogleMap mMap;

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
    private double current_lat, current_lng,college_lat, college_lng;
    private double ride_limit,park_limit;



    parking_fragment parking_fragment;

    //holds the permissions needed for the app to function
    String[] permissions = new String[]{Manifest.permission.ACCESS_FINE_LOCATION};

    //connects to the server
    {
        try {
            mSocket = IO.socket(krpURL);

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


        socketHandler = new SocketHandler();
        user = new JSONObject();

        //Initializes local db
        db_helper_data = new DB_Helper_Data(this, null);
        db_helper_user = new Db_Helper_User(this,null);
        try {
            user = db_helper_user.getInfo();
        } catch (JSONException e) {
            e.printStackTrace();
        }

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);

        Button btn = (Button) findViewById(R.id.btn_logOff);
        btn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });

        //instantiates the GPS Tracher Service class , which provides the cuser's current gps coordinates
        new GPSTracker(MainActivity.this);



        mSocket.off("updateStatus");

        mSocket.on("updateStatus", new Emitter.Listener() {
            @Override
            public void call(Object... args) {

                JSONObject obj = (JSONObject) args[0];
                Log.d("KTag", "Status Update : " + obj.toString());
                try {
                    user.put("status",obj.getString("status"));
                } catch (JSONException e) {
                    e.printStackTrace();
                }
                checkStatus(obj);
            }
        });


    }

    /*
   Sets up the map
   When a marker is clicked, the markers title (i.e. Parking Lot A) is used to correlate the marker with the value in the spinner
   Spinner then changes value accordingly to match the marker clicked
    */
    public void onMapReady(GoogleMap googleMap) {

        googleMap.setMapStyle(MapStyleOptions.loadRawResourceStyle(this, R.raw.style_json));
        mMap = googleMap;
        LatLng college_selected = new LatLng(27.380469, 33.632096);
        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(college_selected, 18));
        mMap.setOnMapLoadedCallback(new GoogleMap.OnMapLoadedCallback() {
            @Override
            public void onMapLoaded() {
                new EstablishWebSocket().execute();
                mMap.setOnMarkerClickListener(new GoogleMap.OnMarkerClickListener() {
                    @Override
                    public boolean onMarkerClick(Marker marker) {
                        Log.d("KTag", "Marker Clicked : " + marker.getTitle() );
                        parking_fragment.updateSpinnerSelected(marker.getTitle());
                        return false;
                    }
                });
            }
        });

    }


    /*
    Returns true if all permissions have been granted
    Returns false if permissions missing, and then requests the permission
     */
    public boolean askPermissions(){
        for (int i = 0; i < permissions.length; i++) {
            String permission = permissions[i];
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{permission}, 123);
                return false;
            }
        }
        return true;
    }

    /*
    After the permission alert diolog is requested, in the clase that the user clicks deny, it asks again and again
     */
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        if (requestCode == 123) {
            for (int i = 0; i < permissions.length; i++) {
                String permission = permissions[i];
                if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(this, new String[]{permission}, 123);
                }
            }
        }
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

    /*
    Async Task
    Emits the set user event, which correlates socket connection with the user id
    For now, random user_id is generated by random number and converted to hex
    */
    private class SetUser extends AsyncTask<JSONObject, Void, Void> {
        @Override
        protected Void doInBackground(JSONObject... params) {

            Log.d("KTag", "Set User Event Called");

            try {
                JSONObject obj = db_helper_user.getInfo();

                user.put("user_id", obj.get("user_id"));
                user.put("user_name", obj.get("user_name"));
                mSocket.emit("setUser", user);

            } catch (JSONException e) {
                e.printStackTrace();
            }
            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            new MainActivity.GetVersionData().execute();
        }
    }

    /*
   Async task that calles REST API to first get the current data version number from db_helper_data
   Then passes that into the 'checkVersion' URL
    */
    private class GetVersionData extends AsyncTask<Object, Object, Void> {
        @Override
        protected Void doInBackground(Object... args) {
            try {
                //REST API url ; calls db method to get the largest verison
                String urlstring = krpURL + "/checkVersion?ver=" + db_helper_data.getAllCollegeVersion();
                Log.d("KTag", Integer.toString(db_helper_data.getAllCollegeVersion()));
                Log.d("KTag", "GetVersionData REST API check");
                URL versionUrl = new URL(urlstring);
                HttpURLConnection myConnection = (HttpURLConnection) versionUrl.openConnection();
                myConnection.setRequestProperty("User-Agent", "android-client");
                if (myConnection.getResponseCode() == 200) {
                    InputStream responseBody = myConnection.getInputStream();
                    InputStreamReader responseBodyReader = new InputStreamReader(responseBody, "UTF-8");
                    JsonReader jsonReader = new JsonReader(responseBodyReader);
                    String var = getStringFromInputStream(responseBody);
                    version_data = new JSONObject(var);
                    Log.d("KTag", "Sucsessful http REST API");

                } else {
                    Log.d("KTag", "Error");
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
                Log.d("KTag", "checkVersion : New Data");
                new PushNewData().execute();
            } else if (code == 1) {
                //in case local db had up to date data
                Log.d("KTag", "checkVersion : NO New Data");
                startCollegeFragment();

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

            Log.d("KTag", "PushNewData");
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
            startCollegeFragment();
        }
    }

    /*
    Clears the map of all markers and adds the fragment to the view
     */
    public void startCollegeFragment() {
        mMap.clear();
        markers.clear();
        Bundle bundle = new Bundle();
        bundle.putDouble("current_lat",current_lat);
        bundle.putDouble("current_lg",current_lng);
        college_fragment college_fragment = new college_fragment();
        college_fragment.setArguments(bundle);
        FragmentManager fm = getSupportFragmentManager();
        FragmentTransaction transaction = fm.beginTransaction();
        transaction.replace(R.id.contentFragment, college_fragment);
        transaction.commit();

    }


    //Moves map focus when a new spinner item is clicked for the college_fragment
    @Override
    public void onCollegeSpinnerItemSelected(float lat, float lng,float ridel,float parkl, String college_id) {
        mMap.clear();
        college_lat = lat;
        college_lng = lng;
        ride_limit = ridel;
        park_limit = parkl;
        Log.d("KTag","College Selected: "+ college_lat + ","+ college_lng + " | Ride Limits : "+ ride_limit + ","+park_limit);
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
        if(askPermissions() == true){
            mMap.clear();
            current_lat = GPSTracker.latitude;
            current_lng = GPSTracker.longitude;

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
                Marker marker = mMap.addMarker(new MarkerOptions().position( new LatLng(current_lat,current_lng)).title("current location").icon(BitmapDescriptorFactory.fromResource(R.drawable.user_marker)));
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
                builder.include(marker.getPosition());
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
        else{
            Toast.makeText(this, "Need GPS Access to Continue",Toast.LENGTH_LONG).show();
        }

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
    public void onParkingSpinnerItemSelected(float lat, float lng) {
        LatLng parking = new LatLng(lat, lng);
        mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(parking, 17));
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
            Log.d("KTag", Double.toString(lat) + " " + Double.toString(lng));
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
        startCollegeFragment();
        JSONObject obj = new JSONObject();
        try {
            obj.put("college_id", selected_college_id);
            obj.put("parkinglot_id",selected_parkinglot_id);
            obj.put("type",type);
            obj.put("pickup_lat",pu_lat);
            obj.put("pickup_lng",pu_lng);
            mSocket.emit("register",obj);
            Log.d("KTag","Register Event : "+ obj.toString());
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    public void startWaitingActivity(String college_id, String parkinglot_id, String client_type){
        Log.d("KTag","Start Waiting Activity");
        Intent intent = new Intent(this, Waiting_Activity.class);
        intent.putExtra("selected_college_id", college_id);
        intent.putExtra("selected_parkinglot_id", parkinglot_id);
        intent.putExtra("type", client_type);
        startActivity(intent);
    }

    public void startMatchActivity(JSONObject obj) throws JSONException {
        Intent intent = new Intent(this, MatchActivity.class);
        Log.d("KTag","Match : "+ obj.toString());
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
            if(user.getString("user_id").equals(obj.get("rider_user_id"))){
                intent.putExtra("user_id",obj.getString("rider_user_id"));
                intent.putExtra("user_name",obj.getString("rider_user_name"));
            }
            else{
                intent.putExtra("user_id",obj.getString("parker_user_id"));
                intent.putExtra("user_name",obj.getString("parker_user_name"));
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }

        startActivity(intent);
    }


    @Override
    protected void onResume() {
        FragmentManager fm = this.getSupportFragmentManager();
        for(int i = 0; i < fm.getBackStackEntryCount(); ++i) {
            fm.popBackStack();
        }
        try {
            if(user.get("status") != null){
                Log.d("KTag","getUserStatus on REsume");
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

        mSocket.disconnect();
        super.onDestroy();
    }

    private void checkStatus(JSONObject obj){
        Log.d("KTag","Check Status : \n"+obj.toString());
        Log.d("KTag","User : \n"+user.toString());
        try {
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






}
