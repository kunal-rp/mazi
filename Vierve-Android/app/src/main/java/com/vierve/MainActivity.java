package com.vierve;

import android.*;
import android.Manifest;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.AsyncTask;
import android.os.Build;
import android.support.annotation.NonNull;
import android.support.annotation.RequiresApi;
import android.support.v4.app.ActivityCompat;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentTransaction;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.JsonReader;
import android.util.Log;
import android.widget.Toast;

import com.github.nkzawa.emitter.Emitter;
import com.github.nkzawa.socketio.client.IO;
import com.github.nkzawa.socketio.client.Socket;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
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
import java.net.MalformedURLException;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Random;


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


    private GoogleMap mMap;

    //local db to store data for college and parking lot data
    //Future use : hold user credential data
    private DB_Helper db_helper;

    //holds all of the markers to be shown on the map
    private ArrayList<Marker> markers = new ArrayList<>();

    //holds the college id,lat,lng of the current college id
    public String selected_college_id;
    public String selected_parkinglot_id;
    public String type;

    //holds the pick up location for the request
    public Float pu_lat;
    public Float pu_lng;

    //holds current
    public float lat;
    public float lng;

    //hodls user's current coordinates
    private double current_lat, current_lng;


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
        db_helper = new DB_Helper(this, null);

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);

        //instantiates the GPS Tracher Service class , which provides the cuser's current gps coordinates
        new GPSTracker(MainActivity.this);

        //remove previous listeners for this event
        mSocket.off("updateStatus");


        //simply changes the status of the user
        //possible statuses : initial_connected , waiting_match , matched
        mSocket.on("updateStatus", new Emitter.Listener() {
            @Override
            public void call(Object... args) {
                try {
                    JSONObject obj = (JSONObject) args[0];
                    Log.d("KTag", "Status Update : " + obj.toString());
                    user.put("status", obj.getString("status"));
                } catch (JSONException e) {
                    e.printStackTrace();
                }
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
        LatLng college_selected = new LatLng(lat, lng);
        mMap.moveCamera(CameraUpdateFactory.newLatLng(college_selected));
        mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(college_selected, 17));
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
            super.onPostExecute(aVoid);
            new MainActivity.SetUser().execute();
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
                //Static random values for the user id and name
                Random r = new Random();

                //Future Use : Get user id and name from the local DB
                //For now, generates random number and converts to Hex
                int Result = r.nextInt(16777216);

                user.put("user_id", Integer.toHexString(Result));
                //username is 'User' + user_id
                user.put("user_name", "User" + Integer.toHexString(Result));

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
   Async task that calles REST API to first get the current data version number from db_helper
   Then passes that into the 'checkVersion' URL
    */
    private class GetVersionData extends AsyncTask<Object, Object, Void> {
        @Override
        protected Void doInBackground(Object... args) {
            try {
                //REST API url ; calls db method to get the largest verison
                String urlstring = krpURL + "/checkVersion?ver=" + db_helper.getAllCollegeVersion();
                Log.d("KTag", Integer.toString(db_helper.getAllCollegeVersion()));
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

            } catch (MalformedURLException e) {
                Log.d("KTag", e.toString());
                e.printStackTrace();
            } catch (IOException e) {
                Log.d("KTag", e.toString());
                e.printStackTrace();
            } catch (JSONException e) {
                Log.d("KTag", e.toString());
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
            db_helper.clearAllTables();

            try {
                //breaks up college data and parking data into vars
                JSONObject college_data = version_data.getJSONObject("college_data");
                JSONObject parking_data = version_data.getJSONObject("parking_data");

                //parses array of ids to get all of the college data
                JSONArray college_ids = college_data.getJSONArray("ids");

                //pushes data from college into the local db table for colleges
                for (int i = 0; i < college_ids.length(); i++) {
                    int num = college_ids.getInt(i);
                    db_helper.addCollege(num, college_data.getJSONObject(Integer.toString(num)));
                }

                //parses array of ids to get all of the parking data
                JSONArray parkinglot_ids = parking_data.getJSONArray("ids");

                //pushes data from college into the local db table for parking
                for (int i = 0; i < parkinglot_ids.length(); i++) {
                    int num = parkinglot_ids.getInt(i);
                    db_helper.addParkingLot(num, parking_data.getJSONObject(Integer.toString(num)));
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
        college_fragment college_fragment = new college_fragment();
        FragmentManager fm = getSupportFragmentManager();
        FragmentTransaction transaction = fm.beginTransaction();
        transaction.replace(R.id.contentFragment, college_fragment);
        transaction.commit();

    }


    //Moves map focus when a new spinner item is clicked for the college_fragment
    @Override
    public void onCollegeSpinnerItemSelected(float lat, float lng, String college_id) {
        LatLng college = new LatLng(lat, lng);
        mMap.moveCamera(CameraUpdateFactory.newLatLng(college));
        mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(college, 13));
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
            current_lat = GPSTracker.latitude;
            current_lng = GPSTracker.longitude;
            /*
            HERE will check if the user's current location is close enough for it to request a parking spot or a ride
            For a Park : 3 mile
            For a Ride : 1 mile
             */
            Log.d("KTag","Location Change Lat:"+ current_lat+ "Lng :"+ current_lng);
            try {
                String status = user.getString("status");

                /*
                For now if the match activity is called and it goes back to this activity, the status is reverted back to the 'initial_connected'
                Future Use: After Match activity is the Rating Activity, and after that is finished it automatically goes back to this activity and the server will update the status
                 */

                if (status.equals("matched")) {
                    user.put("status", "initial_connected");
                }
                status = user.getString("status");
                if ((user.getString("status")).equals("initial_connected")) {
                    type = t;
                    user.put("type",type);
                    startParkingFragment(selected_college_id);
                }

            } catch (JSONException e) {
                e.printStackTrace();
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
            startWaitingActivity(true);
        }
    }


    //Moves map focus when a new spinner item is clicked for the parking_fragment
    @Override
    public void onParkingSpinnerItemSelected(float lat, float lng) {
        LatLng parking = new LatLng(lat, lng);
        mMap.moveCamera(CameraUpdateFactory.newLatLng(parking));
        mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(parking, 17));
    }

    /*
    Sequentially would occur after the parking_fragment
    In the case that the "Ride" Action button is clicked, the location of the pick up is requested
     */
    public void startPickupFragment() {
        mMap.clear();
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
        Log.d("KTag", Double.toString(lat) + " " + Double.toString(lng));
        startWaitingActivity(true);
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
    public void startWaitingActivity(boolean submitRequest) {
        startCollegeFragment();
        Intent intent = new Intent(this, Waiting_Activity.class);
        intent.putExtra("selected_college_id", selected_college_id);
        intent.putExtra("selected_parkinglot_id", selected_parkinglot_id);
        if (type.equals("ride")) {
            intent.putExtra("pickup_lat", pu_lat);
            intent.putExtra("pickup_lng", pu_lng);
        }
        intent.putExtra("type", type);
        intent.putExtra("submitRequest", submitRequest);
        intent.putExtra("user", user.toString());
        startActivity(intent);
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
}
