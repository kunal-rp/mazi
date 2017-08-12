package com.mazi.android;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.design.widget.FloatingActionButton;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentTransaction;
import android.util.JsonReader;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
import android.widget.TextView;

import com.google.android.gms.maps.CameraUpdateFactory;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.SupportMapFragment;
import com.google.android.gms.maps.model.LatLng;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;

import static android.graphics.Paint.ANTI_ALIAS_FLAG;


public class college_fragment extends Fragment {


    private DB_Helper db_helper;

    //List used to store the college id, lat, lng
    private ArrayList<ArrayList<String>>hidden_college;

    //arrays for spinner info ; element match the hidden list
    public ArrayList<String> face_college = new ArrayList<>();

    private Spinner mCollegeSpinner;

    //holds the college id,lat,lng of the current college id
    public String selected;
    public float lat;
    public float lng;


    OnHeadlineSelectedListener mCallback;

    // Container Activity must implement this interface
    public interface OnHeadlineSelectedListener {
        public void onSpinnerItemSelected(float lat, float lng, String college_id);
        public void onRequest(String type);
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
        face_college = new ArrayList<>();
        hidden_college = new ArrayList<ArrayList<String>>();

       return inflater.inflate(R.layout.fragment_college, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        new college_fragment.GetAllCollegeToSpinner().execute();
        db_helper = new DB_Helper(getActivity(), null);
        //Sets floating buttons
        FloatingActionButton fab = (FloatingActionButton) view.findViewById(R.id.requestRideButton);
        fab.setImageBitmap(textAsBitmap("RIDE", 40, Color.WHITE ));

        FloatingActionButton fab2 = (FloatingActionButton) view.findViewById(R.id.requestParkingButton);
        fab2.setImageBitmap(textAsBitmap("PARK", 40, Color.WHITE ));

        //setup for the two spinners for college and parking lot selection
        mCollegeSpinner = (Spinner) view.findViewById(R.id.collegeMenu);



        PopulateSpinner(mCollegeSpinner,face_college);

        mCollegeSpinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> adapterView, View view, int i, long l) {

                selected = hidden_college.get(i).get(0);//id
                lat = Float.parseFloat(hidden_college.get(i).get(2));//lat
                lng = Float.parseFloat(hidden_college.get(i).get(3));//lng
                mCallback.onSpinnerItemSelected(lat,lng, hidden_college.get(i).get(0));
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });

        fab.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mCallback.onRequest("ride");

            }
        });
        fab2.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mCallback.onRequest("park");
            }
        });

    }

    @Override
    public void onDetach() {
        super.onDetach();
        Log.d("KTag","College Fragment Detach");
        mCallback = null;

    }

    private void PopulateSpinner(Spinner spinner, ArrayList<String> list) {
        ArrayAdapter<String> adapter = new ArrayAdapter<>(getActivity(), android.R.layout.simple_spinner_item, list);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        spinner.setAdapter(adapter);
    }



    /*
    Method used to put text in the floating buttons
     */
    public static Bitmap textAsBitmap(String text, float textSize, int textColor) {
        Paint paint = new Paint(ANTI_ALIAS_FLAG);
        paint.setTextSize(textSize);
        paint.setColor(textColor);
        paint.setTextAlign(Paint.Align.LEFT);
        float baseline = -paint.ascent(); // ascent() is negative
        int width = (int) (paint.measureText(text) + 0.0f); // round
        int height = (int) (baseline + paint.descent() + 0.0f);
        Bitmap image = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);

        Canvas canvas = new Canvas(image);
        canvas.drawText(text, 0, baseline, paint);
        return image;
    }

    /*
    Updates the college spinner with data from the local db
     */

    private class GetAllCollegeToSpinner extends AsyncTask<Object, Object, Void>{

        @Override
        protected Void doInBackground(Object... params) {


            ArrayList<ArrayList<String>> temp= db_helper.getAllCollegesInformation();
            for(int i = 0; i < temp.size(); i++){
                ArrayList<String> temp2 = new ArrayList<>();
                temp2.add (temp.get(i).get(0));//id
                temp2.add (temp.get(i).get(1));//name
                temp2.add (temp.get(i).get(2));//lat
                temp2.add (temp.get(i).get(3));//lng
                hidden_college.add(temp2);//id,lat,lng
                face_college.add(temp.get(i).get(1));//name
            }
            return null;
        }
        @Override
        protected void onPostExecute(Void aVoid) {
            super.onPostExecute(aVoid);
            PopulateSpinner(mCollegeSpinner,face_college);

        }
    }

}
