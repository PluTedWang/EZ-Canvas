// EZCanvas never sends mail for the student. These build the links that hand a finished
// draft to the student's own mail client, where they press send.

export type Draft = { to: string; subject: string; body: string };

// encodeURIComponent leaves ! ' ( ) * alone; mail clients handle those, but + must not
// survive in a query string or Gmail renders it as a space.
const encode = (value: string) => encodeURIComponent(value).replace(/\+/g, "%2B");

export function mailtoUrl({ to, subject, body }: Draft) {
  const query = new URLSearchParams();
  if (subject) query.set("subject", subject);
  if (body) query.set("body", body);
  const search = query.toString().replace(/\+/g, "%20");
  return `mailto:${encode(to)}${search ? `?${search}` : ""}`;
}

export function gmailUrl({ to, subject, body }: Draft) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encode(to)}&su=${encode(subject)}&body=${encode(body)}`;
}
