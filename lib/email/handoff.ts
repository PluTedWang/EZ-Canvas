// EZCanvas never sends mail for the student. These build the links that hand a finished
// draft to the student's own mail client, where they press send.

export type Draft = { to: string; subject: string; body: string };


export function mailtoUrl({ to, subject, body }: Draft) {
  const query = new URLSearchParams();
  if (subject) query.set("subject", subject);
  if (body) query.set("body", body);
  const search = query.toString().replace(/\+/g, "%20");
  return `mailto:${encodeURIComponent(to)}${search ? `?${search}` : ""}`;
}

// encodeURIComponent already turns + into %2B, so Gmail never reads a plus as a space.
export function gmailUrl({ to, subject, body }: Draft) {
  const encode = encodeURIComponent;
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encode(to)}&su=${encode(subject)}&body=${encode(body)}`;
}
