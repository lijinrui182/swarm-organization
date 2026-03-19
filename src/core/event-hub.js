const EventEmitter = require("node:events");

class EventHub {
  constructor() {
    this.emitter = new EventEmitter();
    this.clients = new Set();
  }

  subscribe(response) {
    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    response.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);
    this.clients.add(response);

    const heartbeat = setInterval(() => {
      response.write(`event: ping\ndata: ${Date.now()}\n\n`);
    }, 15000);

    response.on("close", () => {
      clearInterval(heartbeat);
      this.clients.delete(response);
    });
  }

  publish(type, payload) {
    const envelope = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };

    this.emitter.emit(type, envelope);

    const eventName = type.replace(/\./g, "_");
    for (const response of this.clients) {
      response.write(`event: ${eventName}\ndata: ${JSON.stringify(envelope)}\n\n`);
    }
  }

  on(type, listener) {
    this.emitter.on(type, listener);
  }
}

module.exports = {
  EventHub,
};
