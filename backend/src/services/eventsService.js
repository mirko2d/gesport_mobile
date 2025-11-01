const Event = require('../models/Event');
const Enrollment = require('../models/Enrollment');

async function fetchActiveEvents() {
  return Event.find({ activo: true }).sort({ fecha: 1 }).lean();
}

async function countParticipants(eventId) {
  return Enrollment.countDocuments({ event: eventId });
}

async function fetchActiveEventsWithCounts() {
  const events = await fetchActiveEvents();
  const withCounts = await Promise.all(
    events.map(async (ev) => {
      const count = await countParticipants(ev._id);
      return {
        ...ev,
        participantes: count,
        maxParticipantes: typeof ev.cupos === 'number' ? ev.cupos : null,
      };
    })
  );
  return withCounts;
}

module.exports = {
  fetchActiveEvents,
  fetchActiveEventsWithCounts,
  countParticipants,
};
