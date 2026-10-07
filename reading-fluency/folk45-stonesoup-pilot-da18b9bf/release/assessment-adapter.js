(() => {
  const previousSink = window.ONQ_EVENT_SINK;
  const axisByActivity = {
    "intervention.word_chunk": ["accuracy", "automaticity"],
    "intervention.word_phrase": ["accuracy", "automaticity", "vocabulary"],
    "intervention.sentence": ["accuracy", "automaticity", "vocabulary"],
    "evaluation.paragraph": ["accuracy", "automaticity", "vocabulary", "basicComprehension"],
    "support.printable": []
  };
  const attempts = new Map();

  window.ONQ_EVENT_SINK = rawEvent => {
    const event = { ...rawEvent, measure_axes: axisByActivity[rawEvent.activity_id] || [] };
    if (event.item_id) {
      const count = attempts.get(event.item_id) || 0;
      if (event.event_type === "answer") {
        event.attempt_index = count + 1;
        event.independence_evidence = event.correct && count === 0 ? "independent_first_response" : event.correct ? "correct_after_retry" : "incorrect_attempt";
        if (!event.correct) attempts.set(event.item_id, count + 1);
      }
      if (event.event_type === "hint") event.independence_evidence = "hint_used";
      if (event.event_type === "retry") event.independence_evidence = "retry_required";
    }
    window.ONQ_LAST_EVENT = event;
    if (typeof previousSink === "function") previousSink(event);
  };
})();
