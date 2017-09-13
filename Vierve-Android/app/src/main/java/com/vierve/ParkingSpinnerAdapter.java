package com.vierve;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.TextView;

import java.util.ArrayList;

/**
 * Created by kunal on 9/9/17.
 */

public class ParkingSpinnerAdapter extends ArrayAdapter<ArrayList<String>> {

    public ParkingSpinnerAdapter(Context context, ArrayList<ArrayList<String>> hidden_parking) {
        super(context, 0, hidden_parking);
    }

    @NonNull
    @Override
    public View getView(int position, @Nullable View convertView, @NonNull ViewGroup parent) {
        // Get the data item for this position
        ArrayList<String> current_college = getItem(position);
        // Check if an existing view is being reused, otherwise inflate the view
        if (convertView == null) {
            convertView = LayoutInflater.from(getContext()).inflate(R.layout.spinner_object_college_display, parent, false);
        }
        // Lookup view for data population
        TextView college_name = (TextView) convertView.findViewById(R.id.college_name);
        // Populate the data into the template view using the data object
        college_name.setText(current_college.get(1));

        // Return the completed view to render on screen
        return convertView;
    }

    @Override
    public View getDropDownView(int position, @Nullable View convertView, @NonNull ViewGroup parent) {
        // Get the data item for this position
        ArrayList<String> current_college = getItem(position);
        // Check if an existing view is being reused, otherwise inflate the view
        if (convertView == null) {
            convertView = LayoutInflater.from(getContext()).inflate(R.layout.spinner_item, parent, false);
        }
        // Lookup view for data population
        TextView text = (TextView) convertView.findViewById(R.id.text);
        // Populate the data into the template view using the data object
        text.setText(current_college.get(1));

        // Return the completed view to render on screen
        return convertView;
    }
}