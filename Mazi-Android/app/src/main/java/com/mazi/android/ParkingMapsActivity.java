package com.mazi.android;

import android.content.Intent;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.Spinner;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;

import org.json.JSONObject;

import java.util.ArrayList;

public class ParkingMapsActivity extends AppCompatActivity implements OnMapReadyCallback {

    private GoogleMap mMap;

    //gets values from previous activity
    private String type;
    public float lat, lng;
    public String selected_college_id;

    //stores selected parking lot id
    public String selected_parkinglot_id;

    private DB_Helper db_helper;


    private Spinner mParkingSpinner;

    //array of parking lot id, lat, lng
    private ArrayList<ArrayList<String>> hidden_parkinglots;

    //arrays for spinner name, elements match with hidden
    public ArrayList<String> face_parkinglots = new ArrayList<>();


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.fragment_parking);

        Button submit = (Button) findViewById(R.id.submit);
        submit.setBackgroundResource(R.color.colorPrimary);

        //initializes var for local db
        db_helper = new DB_Helper(getApplicationContext(), null);

        //gets previous activity data
        Intent intent = getIntent();
        Bundle bundle = intent.getExtras();
        selected_college_id = bundle.getString("selected_college_id");
        type = bundle.getString("type");

        //spinner for parking lots
        mParkingSpinner = (Spinner) findViewById(R.id.parkinglotMenu);

        //async runs to get parking lots from college id
        new ParkingMapsActivity.GetParkingDataTask().execute();

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);

        /*
        * Will update the map focus when the spinner changes
        * */
        mParkingSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {
                //gets corresponding values to the parking lot name in spinner
                lat = Float.parseFloat(hidden_parkinglots.get(i).get(2));
                lng = Float.parseFloat(hidden_parkinglots.get(i).get(3));
                selected_parkinglot_id = hidden_parkinglots.get(i).get(0);

                //moves map focus
                LatLng parkingLot = new LatLng(lat, lng);
                mMap.moveCamera(CameraUpdateFactory.newLatLng(parkingLot));
                mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(parkingLot,17));
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) {}
        });


    }

    /*
    Gets data from local db for the parking data
     */
    private class GetParkingDataTask extends AsyncTask<JSONObject, Void, Void> {
        @Override
        protected Void doInBackground(JSONObject... object) {
            face_parkinglots = new ArrayList<>();
            hidden_parkinglots = new ArrayList<ArrayList<String>>();
            Log.d("KTag", "ParkingLots data retrieved for college id : "+selected_college_id);
            ArrayList<ArrayList<String>> temp= db_helper.getAllParkingLotsFromCollege(selected_college_id);
            for(int i = 0; i < temp.size(); i++){
                ArrayList<String> temp2 = new ArrayList<>();
                temp2.add(temp.get(i).get(0));//id
                temp2.add(temp.get(i).get(1));//name
                temp2.add(temp.get(i).get(2));//lat
                temp2.add(temp.get(i).get(3));//lng
                hidden_parkinglots.add(temp2);//id,name,lat,lng
                face_parkinglots.add(temp.get(i).get(1));
            }
            return null;
        }

        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            PopulateSpinner(mParkingSpinner,face_parkinglots);
        }


    }

    private void PopulateSpinner(Spinner spinner, ArrayList<String> list) {
        for(int i = 0; i < hidden_parkinglots.size(); i++){
            ArrayList<String> temp = hidden_parkinglots.get(i);
            LatLng parkingLot = new LatLng(Float.parseFloat(temp.get(2)), Float.parseFloat(temp.get(3)));
            MarkerOptions marker = new MarkerOptions().position(parkingLot).title(temp.get(1));
            mMap.addMarker(marker);

        }
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, list);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner.setAdapter(adapter);
    }


    /*
    On click for the button , will call next intent an pass the selected college and parking lot id
     */
    public void submitRequest(View view){
        Intent mapIntent = new Intent(this, Waiting_Activity.class);
        mapIntent.putExtra("selected_college_id",selected_college_id);
        mapIntent.putExtra("selected_parkinglot_id",selected_parkinglot_id);
        mapIntent.putExtra("type",type);
        startActivity(mapIntent);
    }

    /**
     * Manipulates the map once available.
     * This callback is triggered when the map is ready to be used.
     * This is where we can add markers or lines, add listeners or move the camera. In this case,
     * we just add a marker near Sydney, Australia.
     * If Google Play services is not installed on the device, the user will be prompted to install
     * it inside the SupportMapFragment. This method will only be triggered once the user has
     * installed Google Play services and returned to the app.
     */
    @Override
    public void onMapReady(GoogleMap googleMap) {
        mMap = googleMap;

    }


}
