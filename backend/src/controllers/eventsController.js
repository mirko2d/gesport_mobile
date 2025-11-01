const { fetchActiveEventsWithCounts } = require('../services/eventsService');

async function listEvents(req, res, next) {
  try {
    const withCounts = await fetchActiveEventsWithCounts();
    res.json(withCounts);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listEvents,
};
