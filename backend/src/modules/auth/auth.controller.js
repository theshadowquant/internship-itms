const authService = require('./auth.service');

const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    return res.status(201).json({
      success: true,
      message: 'Account successfully registered and authenticated.',
      data: result,
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    return res.status(200).json({
      success: true,
      message: 'Successfully logged in.',
      data: result,
    });
  } catch (error) {
    res.status(401);
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
      });
    }

    const result = await authService.refreshSession(refreshToken);
    return res.status(200).json({
      success: true,
      message: 'Session refreshed successfully.',
      data: result,
    });
  } catch (error) {
    res.status(401);
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logoutUser(req.user.id);
    return res.status(200).json({
      success: true,
      message: 'Session revoked. Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Authenticated user profile not found.',
      });
    }
    return res.status(200).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
};
