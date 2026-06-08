import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, predictions } = body;

    if (!user_id || !Array.isArray(predictions) || predictions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid payload data' },
        { status: 400 }
      );
    }

    const formattedPredictions = predictions.map((pred: any) => ({
      user_id,
      group_name: pred.group_name,
      predicted_1st_place: pred.first_place_id,
      predicted_2nd_place: pred.second_place_id,
      predicted_3rd_place: pred.third_place_id,
      predicted_4th_place: pred.fourth_place_id,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('wc_group_predictions')
      .upsert(formattedPredictions, {
        onConflict: 'user_id,group_name',
      });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      saved_count: formattedPredictions.length,
    });
  } catch (error: any) {
    console.error('Group Prediction Error:', error);
    return NextResponse.json(
      { error: 'Failed to save group predictions' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing user_id parameter' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('wc_group_predictions')
      .select('*')
      .eq('user_id', user_id);

    if (error) throw error;

    const formattedData = data.map((d: any) => ({
      ...d,
      first_place_id: d.predicted_1st_place,
      second_place_id: d.predicted_2nd_place,
      third_place_id: d.predicted_3rd_place,
      fourth_place_id: d.predicted_4th_place,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error: any) {
    console.error('Fetch Predictions Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}