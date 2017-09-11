package com.vierve;

import android.app.Activity;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.Spinner;

import com.google.android.gms.maps.model.BitmapDescriptorFactory;
import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.Marker;
import com.google.android.gms.maps.model.MarkerOptions;

import java.util.ArrayList;


public class parking_fragment extends Fragment {

    private DB_Helper_Data db_helper_data;

    //List used to store the college id, lat, lng
    private ArrayList<ArrayList<String>>hidden_parkinglots;

    //arrays for spinner info ; element match the hidden list
    public ArrayList<String> face_parkinglots = new ArrayList<>();

    private Spinner mParkingSpinner;

    private  String selected_college_id;

    private ArrayList<MarkerOptions> markers;

    //holds the parkinglot id,lat,lng of the current parkinglot id
    public String selected_parkinglot_id;
    public float lat;
    public float lng;


    OnHeadlineSelectedListener mCallback;

    // Container Activity must implement this interface
    public interface OnHeadlineSelectedListener {
        public void onParkingSpinnerItemSelected(float lat, float lng,int index);
        public void setMarkers(ArrayList<MarkerOptions> markers,ArrayList<String> list);
        public void setParkingLot(String selected_parkinglot_id);
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

        db_helper_data = new DB_Helper_Data(getActivity(), null);

        //setup for the two spinners for college and parking lot selection
        mParkingSpinner = (Spinner) view.findViewById(R.id.parkinglotMenu);

        GetParkingData();


        mParkingSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {

                lat = Float.parseFloat(hidden_parkinglots.get(i).get(2));
                lng = Float.parseFloat(hidden_parkinglots.get(i).get(3));
                selected_parkinglot_id =  hidden_parkinglots.get(i).get(0);
                mCallback.onParkingSpinnerItemSelected(lat,lng,i);
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });

        Button button = (Button) view.findViewById(R.id.submit);
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mCallback.setParkingLot(selected_parkinglot_id);
            }
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

    private void GetParkingData() {
        face_parkinglots = new ArrayList<>();
        hidden_parkinglots = new ArrayList<ArrayList<String>>();
        Log.d("KTag", "ParkingLots data retrieved for college id : " + selected_college_id);
        ArrayList<ArrayList<String>> temp = db_helper_data.getAllParkingLotsFromCollege(selected_college_id);
        for (int i = 0; i < temp.size(); i++) {
            ArrayList<String> temp2 = new ArrayList<>();
            temp2.add(temp.get(i).get(0));//id
            temp2.add(temp.get(i).get(1));//name
            temp2.add(temp.get(i).get(2));//lat
            temp2.add(temp.get(i).get(3));//lng
            hidden_parkinglots.add(temp2);//id,name,lat,lng
            face_parkinglots.add(temp.get(i).get(1));
        }
        PopulateSpinner(mParkingSpinner, hidden_parkinglots);
    }

    private void PopulateSpinner(Spinner spinner, ArrayList<ArrayList<String>> list) {
        ParkingSpinnerAdapter parkingSpinnerAdapter = new ParkingSpinnerAdapter(getContext(),list);
        spinner.setAdapter(parkingSpinnerAdapter);
        ArrayList<String> face = new ArrayList<>();
        for(int i = 0; i < hidden_parkinglots.size(); i++){
            ArrayList<String> temp = hidden_parkinglots.get(i);
            LatLng parkingLot = new LatLng(Float.parseFloat(temp.get(2)), Float.parseFloat(temp.get(3)));
            MarkerOptions marker = new MarkerOptions().position(parkingLot).title(temp.get(1)).icon(BitmapDescriptorFactory.fromResource(R.drawable.other_marker));;
            markers.add(marker);
            face.add(temp.get(1));

        }
        mCallback.setMarkers(markers,face);
    }

    public void updateSpinnerSelected(String id){

        int index = face_parkinglots.indexOf(id);
        Log.d("KTag",id + "|"+Integer.toString(index) + "|"+ hidden_parkinglots.toString());
        mParkingSpinner.setSelection(index);
    }






}
