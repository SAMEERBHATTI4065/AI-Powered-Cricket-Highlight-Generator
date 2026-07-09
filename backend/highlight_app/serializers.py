def serialize_events(events, video_duration=None):
    """
    Validates and enriches events from the analysis session.
    1. Validates timestamp range (>0 and optionally < video_duration)
    2. Adds timestamp_formatted (e.g. "5:45")
    3. Adds event_label (e.g. "SIX at 5:45")
    """
    serialized_events = []
    
    if not isinstance(events, list):
        return serialized_events
        
    for event in events:
        ts = event.get('timestamp')
        if ts is None:
            continue
            
        try:
            ts = float(ts)
        except (ValueError, TypeError):
            continue
            
        # VALIDATE: must be > 0
        if ts <= 0:
            continue
            
        # VALIDATE: must be < video_duration if provided
        if video_duration and ts >= video_duration:
             continue
             
        # ENRICH: timestamp_formatted
        minutes = int(ts // 60)
        seconds = int(ts % 60)
        timestamp_formatted = f"{minutes}:{seconds:02d}"
        
        # ENRICH: event_label
        event_type = event.get('event_type', 'EVENT')
        event_label = f"{event_type} at {timestamp_formatted}"
        
        event['timestamp_formatted'] = timestamp_formatted
        event['event_label'] = event_label
        serialized_events.append(event)
        
    return serialized_events
