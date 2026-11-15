/** What the greet route is asked: the HTTP method, the path and the `name` query parameter, when there is one. */
export type GreetRequest = {
  readonly method: string;
  readonly path: string;
  readonly name: string | undefined;
};

/** What the greet route answers: a status, a content type and a text body. */
export type GreetResponse = {
  readonly status: number;
  readonly contentType: string;
  readonly body: string;
};
