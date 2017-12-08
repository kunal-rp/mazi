package com.vierve;

import android.app.Activity;
import android.os.Bundle;
import android.support.annotation.Nullable;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;

import com.google.android.gms.maps.model.MarkerOptions;

import java.util.ArrayList;

/**
 * Created by kunal on 9/7/17.
 */

public class match_options_fragment extends Fragment {


    OnHeadlineSelectedListener mCallback;

    Button btn_directions ;
    Button btn_manual_close;

    // Container Activity must implement this interface
    public interface OnHeadlineSelectedListener {
       public void getDirections();
        public void manualClose();
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

    @Nullable
    @Override
    public View onCreateView(LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {


        return inflater.inflate(R.layout.fragment_match_options, container, false);
    }

    @Override
    public void onViewCreated(View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        btn_directions = (Button) view.findViewById(R.id.getDirections);
        btn_manual_close = (Button) view.findViewById(R.id.manual_close);

        Bundle bundle = getArguments();
        if(bundle.getString("type").equals("ride")){
            btn_manual_close.setVisibility(View.INVISIBLE);

        }
        btn_manual_close.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mCallback.manualClose();
            }
        });

        btn_directions.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                mCallback.getDirections();
            }
        });




    }

}
