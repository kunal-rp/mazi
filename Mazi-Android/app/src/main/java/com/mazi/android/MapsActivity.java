package com.mazi.android;

import android.content.Intent;
import android.os.AsyncTask;
import android.support.v4.app.FragmentActivity;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Spinner;

import com.github.nkzawa.socketio.client.Socket;
import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MarkerOptions;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

public class MapsActivity extends AppCompatActivity implements OnMapReadyCallback {

    private GoogleMap mMap;
    public float lat, lng;
    public String parkingLotName;

    private DB_Helper db_helper;


    private Spinner mParkingSpinner;

    private Socket mSocket;

    private ArrayList<ArrayList<String>> hidden_parkinglots;

    //arrays for spinner info
    public ArrayList<String> face_parkinglots = new ArrayList<>();

    public String selected_college_id;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_maps);

        db_helper = new DB_Helper(getApplicationContext(), null);

        Intent intent = getIntent();
        Bundle bundle = intent.getExtras();
        selected_college_id = bundle.getString("selected_college_id");



        mParkingSpinner = (Spinner) findViewById(R.id.parkinglotMenu);


        new MapsActivity.GetParkingDataTask().execute();

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);



        mParkingSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {
                lat = Float.parseFloat(hidden_parkinglots.get(i).get(2));
                lng = Float.parseFloat(hidden_parkinglots.get(i).get(3));
                parkingLotName = mParkingSpinner.getSelectedItem().toString();

                LatLng parkingLot = new LatLng(lat, lng);
//        mMap.addCircle(new CircleOptions().center(parkingLot).radius(80).fillColor(Color.parseColor("#19647E")).strokeColor(Color.parseColor("#06AED5")));
                mMap.moveCamera(CameraUpdateFactory.newLatLng(parkingLot));
                mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(parkingLot,17));
            }

            @Override
            public void onNothingSelected(AdapterView<?> adapterView) {}
        });


    }






    private class GetParkingDataTask extends AsyncTask<JSONObject, Void, Void> {
        @Override
        protected Void doInBackground(JSONObject... object) {
            face_parkinglots = new ArrayList<>();
            hidden_parkinglots = new ArrayList<ArrayList<String>>();
            Log.d("KTag", "Parking LOTS-----");
            ArrayList<ArrayList<String>> temp= db_helper.getAllParkingLotsFromCollege(selected_college_id);
            for(int i = 0; i < temp.size(); i++){
                ArrayList<String> temp2 = new ArrayList<>();
                temp2.add(temp.get(i).get(0));//id
                temp2.add(temp.get(i).get(1));//name
                temp2.add(temp.get(i).get(2));//lat
                temp2.add(temp.get(i).get(3));//lng
                hidden_parkinglots.add(temp2);
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
            mMap.addMarker(new MarkerOptions().position(parkingLot).title(temp.get(1)));
        }


        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, list);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner.setAdapter(adapter);
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
