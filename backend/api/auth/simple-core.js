import { onRequest as signupHandler } from "./signup.js";
import { onRequest as loginHandler } from "./login.js";
import { onRequest as validateHandler } from "./validate.js";
import { 
  onRequestSendVerification,
  onRequestVerify,
  onRequestResend 
} from "./verification.js";
import {
  onRequestSendInvite,
  onRequestAcceptInvite,
  onRequestListInvites,
  onRequestRevokeInvite,
  onRequestMyInvites
} from "./invites.js";

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

  static async sendVerification(request, env) {
    return onRequestSendVerification({ request, env });
  }

  static async verifyEmail(request, env) {
    return onRequestVerify({ request, env });
  }

  static async resendVerification(request, env) {
    return onRequestResend({ request, env });
  }

  static async sendInvite(request, env) {
    return onRequestSendInvite({ request, env });
  }

  static async acceptInvite(request, env) {
    return onRequestAcceptInvite({ request, env });
  }

  static async listInvites(request, env) {
    return onRequestListInvites({ request, env });
  }

  static async revokeInvite(request, env) {
    return onRequestRevokeInvite({ request, env });
  }

  static async myInvites(request, env) {
    return onRequestMyInvites({ request, env });
  }
}
