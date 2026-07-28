import { HttpError } from "../errors/http-error";
import { UserRepository } from "../repositories/user.repositories";
import bcryptjs from "bcryptjs";
let userRepository = new UserRepository();
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { CreateUserDTO, LoginUserDTO, UpdateUserDTO } from "../dtos/user.dto";
import { sendEmail } from "../config/email";

export class UserService {
  async createUser(data: CreateUserDTO) {
    //business logic before creating user
    const emailCheck = await userRepository.getUserByEmail(data.email);
    if (emailCheck) {
      throw new HttpError("Email already in use", 403);
    }

    //hash password
    const hashedPassword = await bcryptjs.hash(data.password, 10); //10 complexity
    data.password = hashedPassword;

    //create user
    const newUser = await userRepository.createUser(data);
    return newUser;
  }
  async loginUser(data: LoginUserDTO) {
    const user = await userRepository.getUserByEmail(data.email);
    if (!user) {
      throw new HttpError("User not found", 404);
    }
    const validPassword = await bcryptjs.compare(data.password, user.password);
    if (!validPassword) {
      throw new HttpError("Invalid credentials", 401);
    }
    //generate jwt
    const payload = {
      id: user._id,
      email: user.email,
      password: user.password,
      fullName: user.fullName,
      role: user.role,
      phoneNumber: user.phoneNumber,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" }); // 30days
    return { token, user };
  }

  async getUserById(userId: string) {
    const user = await userRepository.getUserByID(userId);
    if (!user) {
      throw new HttpError("User not found", 404);
    }
    return user;
  }

  async updateUser(userId: string, data: UpdateUserDTO) {
    const user = await userRepository.getUserByID(userId);
    if (!user) {
      throw new HttpError("User not found", 404);
    }
    if (user.email !== data.email) {
      const emailExists = await userRepository.getUserByEmail(data.email!);
      if (emailExists) {
        throw new HttpError("Email already in use", 403);
      }
    }

    if (data.password) {
      const hashedPassword = await bcryptjs.hash(data.password, 10);
      data.password = hashedPassword;
    }
    const updatedUser = await userRepository.updateUser(userId, data);
    return updatedUser;
  }

  async deleteUser(userId: string) {
    const existingUser = await userRepository.getUserByID(userId);
    if (!existingUser) {
      throw new HttpError("User not found", 404);
    }

    const deleted = await userRepository.deleteUserById(userId);
    if (!deleted) {
      throw new HttpError("Failed to delete user", 500);
    }

    return { message: "User deleted successfully" };
  }

  async sendResetPasswordEmail(email?: string) {
    if (!email) {
      throw new HttpError("Email is required", 400);
    }
    const user = await userRepository.getUserByEmail(email);
    if (!user) {
      throw new HttpError("User not found", 404);
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiry

    // Build a fully inlined mobile-friendly HTML email
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background-color:#F5F0EC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F0EC;">
            <tr>
              <td align="center" style="padding:32px 16px;">
                <!-- Card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                  <!-- Header -->
                  <tr>
                    <td style="padding:32px 24px 0;text-align:center;">
                      <span style="font-size:28px;">🔐</span>
                      <h1 style="margin:12px 0 0;font-size:20px;font-weight:700;color:#050206;letter-spacing:-0.3px;">Password Reset</h1>
                      <p style="margin:8px 0 0;font-size:14px;color:#6B5A50;line-height:1.5;">
                        Use the token below to reset your password in the EliteRefurbLap app. This token will expire in <strong style="color:#050206;">1 hour</strong>.
                      </p>
                    </td>
                  </tr>

                  <!-- Token Box (tappable on mobile) -->
                  <tr>
                    <td style="padding:24px;">
                      <div style="background-color:#F5F0EC;border:1px solid #E8E0D8;border-radius:12px;padding:20px;text-align:center;">
                        <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#9A8174;text-transform:uppercase;letter-spacing:0.8px;">Your Reset Token</p>
                        <code style="display:block;font-size:11px;line-height:1.6;color:#050206;word-break:break-all;background:#FFFFFF;padding:14px;border-radius:8px;border:1px solid #E8E0D8;font-family:'SF Mono',Monaco,Menlo,monospace;-webkit-user-select:all;user-select:all;">${token}</code>
                        <!-- Mobile instructions -->
                        <p style="margin:14px 0 0;font-size:13px;color:#9A8174;">
                          📱 Tap and hold the token above, then select <strong style="color:#050206;">Copy</strong> to paste it into the app.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Steps -->
                  <tr>
                    <td style="padding:0 24px 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom:16px;">
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="28" valign="top" style="padding-top:2px;">
                                  <span style="display:inline-block;width:24px;height:24px;background-color:#050206;color:#FFFFFF;font-size:12px;font-weight:700;text-align:center;line-height:24px;border-radius:50%;">1</span>
                                </td>
                                <td style="padding-left:12px;">
                                  <p style="margin:0;font-size:14px;color:#3B3B3B;line-height:1.5;">
                                    <strong style="color:#050206;">Copy</strong> the token above
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom:16px;">
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="28" valign="top" style="padding-top:2px;">
                                  <span style="display:inline-block;width:24px;height:24px;background-color:#050206;color:#FFFFFF;font-size:12px;font-weight:700;text-align:center;line-height:24px;border-radius:50%;">2</span>
                                </td>
                                <td style="padding-left:12px;">
                                  <p style="margin:0;font-size:14px;color:#3B3B3B;line-height:1.5;">
                                    Open the <strong style="color:#050206;">EliteRefurbLap</strong> app
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <table cellpadding="0" cellspacing="0">
                              <tr>
                                <td width="28" valign="top" style="padding-top:2px;">
                                  <span style="display:inline-block;width:24px;height:24px;background-color:#050206;color:#FFFFFF;font-size:12px;font-weight:700;text-align:center;line-height:24px;border-radius:50%;">3</span>
                                </td>
                                <td style="padding-left:12px;">
                                  <p style="margin:0;font-size:14px;color:#3B3B3B;line-height:1.5;">
                                    <strong style="color:#050206;">Paste</strong> the token and set a new password
                                  </p>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Divider -->
                  <tr>
                    <td style="padding:0 24px;">
                      <hr style="border:none;border-top:1px solid #F0EAE5;margin:0;" />
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding:20px 24px 28px;text-align:center;">
                      <p style="margin:0;font-size:12px;color:#9A8174;line-height:1.5;">
                        Didn't request this? You can safely ignore this email.<br />
                        <span style="color:#C4B0A4;">EliteRefurbLap &bull; Premium Refurbished Laptops</span>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `.trim();

    await sendEmail(user.email, "EliteRefurbLap — Password Reset Token", html);
    return user;
  }

  async resetPassword(token?: string, newPassword?: string) {
    try {
      if (!token || !newPassword) {
        throw new HttpError("Token and new password are required", 400);
      }
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const userId = decoded.id;
      const user = await userRepository.getUserByID(userId);
      if (!user) {
        throw new HttpError("User not found", 404);
      }
      const hashedPassword = await bcryptjs.hash(newPassword, 10);
      await userRepository.updateUser(userId, { password: hashedPassword });
      return user;
    } catch (error) {
      throw new HttpError("Invalid or expired token", 400);
    }
  }
}
