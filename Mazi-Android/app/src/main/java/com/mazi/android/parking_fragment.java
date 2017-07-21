package com.mazi.android;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.design.widget.FloatingActionButton;
import android.support.v4.app.Fragment;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Spinner;

import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;

import org.json.JSONObject;

import java.util.ArrayList;

import static android.graphics.Paint.ANTI_ALIAS_FLAG;


public class parking_fragment extends Fragment {





    private DB_Helper db_helper;

    //List used to store the college id, lat, lng
    private ArrayList<ArrayList<String>>hidden_parkinglots;

    //arrays for spinner info ; element match the hidden list
    public ArrayList<String> face_parkinglots = new ArrayList<>();

    private Spinner mParkingSpinner;

    private  String selected_college_id;

    private ArrayList<MarkerOptions> markers;

    //holds the college id,lat,lng of the current college id
    public String selected;
    public float lat;
    public float lng;


    OnHeadlineSelectedListener mCallback;

    // Container Activity must implement this interface
    public interface OnHeadlineSelectedListener {
        public void onParkingSpinnerItemSelected(float lat, float lng);
        public void setMarkers(ArrayList<MarkerOptions> markers);
    }


    @Override
    public void onAttach(Activity activity) {
        super.onAttach(activity);

        // This makes sure that the container activity has implemented
        // the callback interface. If not, it throws an exception
        try {
            mCallback = (OnHeadlineSelectedListener) activity;
        } catch (ClassCastException e) {
            throw new ClassCastException(activity.toString()
                    + " must implement OnHeadlineSelectedListener");
        }
    }


    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
                             Bundle savedInstanceState) {
       return inflater.inflate(R.layout.fragment_parking, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        Bundle bundle = getArguments();
        selected_college_id = bundle.getString("selected_college_id");


        markers = new ArrayList<>();

        db_helper = new DB_Helper(getActivity(), null);

        //setup for the two spinners for college and parking lot selection
        mParkingSpinner = (Spinner) view.findViewById(R.id.parkinglotMenu);

        new parking_fragment.GetParkingDataTask().execute();


        mParkingSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {

                lat = Float.parseFloat(hidden_parkinglots.get(i).get(2));
                lng = Float.parseFloat(hidden_parkinglots.get(i).get(3));
                 hidden_parkinglots.get(i).get(0);

                mCallback.onParkingSpinnerItemSelected(lat,lng);
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });
    }

    @Override
    public void onDetach() {
        super.onDetach();
        mCallback = null;

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
            markers.add(marker);

        }
        mCallback.setMarkers(markers);
        ArrayAdapter<String> adapter = new ArrayAdapter<>(getActivity(), android.R.layout.simple_spinner_item, list);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner.setAdapter(adapter);
    }




}
