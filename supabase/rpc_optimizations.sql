-- 1000명 동시 접속 대비: 대기 번호 안전 발급 RPC (Race Condition 방지)
CREATE OR REPLACE FUNCTION register_waitlist_v2(
  p_booth_id UUID,
  p_name TEXT,
  p_count INTEGER
) RETURNS jsonb AS $$
DECLARE
  v_next_number INTEGER;
  v_inserted_id UUID;
  v_result jsonb;
BEGIN
  -- 동시 다발적인 요청이 들어올 때 해당 부스의 번호표 발급을 순차적으로 처리하기 위해 Lock(잠금)을 걺
  PERFORM id FROM booths WHERE id = p_booth_id FOR UPDATE;

  -- 가장 마지막 대기 번호를 조회해서 +1
  SELECT COALESCE(MAX(waiting_number), 0) + 1 INTO v_next_number
  FROM waiting_list
  WHERE booth_id = p_booth_id;

  -- 대기표 삽입
  INSERT INTO waiting_list (booth_id, name, count, waiting_number, status)
  VALUES (p_booth_id, p_name, p_count, v_next_number, 'waiting')
  RETURNING id INTO v_inserted_id;

  -- 삽입된 데이터 반환
  v_result := jsonb_build_object(
    'id', v_inserted_id,
    'waiting_number', v_next_number
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
