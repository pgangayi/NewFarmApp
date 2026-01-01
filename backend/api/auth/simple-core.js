import { onRequest as signupHandler } from "./signup.js";
import { onRequest as loginHandler } from "./login.js";
import { onRequest as validateHandler } from "./validate.js";

export class AuthCore {
  static async signup(request, env) {
    return signupHandler({ request, env });
  }

  static async login(request, env) {
    return loginHandler({ request, env });
  }

  static async me(request, env) {
    return validateHandler({ request, env });
  }
}
