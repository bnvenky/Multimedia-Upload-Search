const { Schema, model } = require('mongoose');

const USER_ROLES = ['user', 'admin'];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    // select: false -> the hash is never loaded unless a query explicitly asks for it.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'user', required: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const UserModel = model('User', userSchema);

/** Only these fields are ever sent to clients. */
function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt ?? null,
  };
}

module.exports = { UserModel, USER_ROLES, toPublicUser };
