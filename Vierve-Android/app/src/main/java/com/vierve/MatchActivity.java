package com.vierve;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.util.Log;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.OnMapReadyCallback;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.MapStyleOptions;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;

public class MatchActivity extends AppCompatActivity implements OnMapReadyCallback {


    private double pu_lat, pu_lng;

    private GoogleMap mMap;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_match);

        Intent intent = getIntent();
        Bundle bundle = intent.getExtras();
        pu_lat = bundle.getDouble("pu_lat");
        pu_lng = bundle.getDouble("pu_lng");

        // Obtain the SupportMapFragment and get notified when the map is ready to be used.
        SupportMapFragment mapFragment = (SupportMapFragment) getSupportFragmentManager()
                .findFragmentById(R.id.map);
        mapFragment.getMapAsync(this);


    }

    @Override
    public void onMapReady(GoogleMap googleMap) {

        googleMap.setMapStyle(MapStyleOptions.loadRawResourceStyle(this, R.raw.style_json));

        mMap = googleMap;
        LatLng pickup_loc = new LatLng(pu_lat, pu_lng);

        MarkerOptions marker_options = new MarkerOptions().position(pickup_loc).title("Pichup Location");

        Marker pu_marker = mMap.addMarker(marker_options);
        mMap.moveCamera(CameraUpdateFactory.newLatLng(pickup_loc));
        mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(pickup_loc,13));


    }

}
