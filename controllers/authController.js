import Customer from '../Models/Customer.js';
import passport from 'passport';

export const login = (req, res) => {
  res.render('login');
}

export const verifyLogin = 
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash: false });

export const register = (req, res) => {
  res.render('register');
}

export const verifyRegister = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new Customer({ username, password });
    await user.save();
    res.redirect('/login');
  } catch (error) {
    res.send(error.message);
  }
};

export const changePassword = (req, res) => {
  res.render('changePassword', {user: req.user});
}

export const updatePassword = async (req, res) => {
  try {
    const { username, currPassword, newPassword1, newPassword2 } = req.body;
    if (newPassword1 !== newPassword2) {
      res.send("New passwords don't match.");
      return;
    }
    const user = await Customer.findOne({ username });
    if (!user) {
      res.send("User not found.");
      return;
    }

    user.comparePassword(currPassword, async (err, isMatch) => {
      if (err) {
        res.send("An error occurred.");
        return;
      }
      if (!isMatch) {
        res.send("Current password is incorrect.");
        return;
      }
      
      user.password = newPassword1; 
      await user.save();
      console.log('Password updated');
      res.redirect('/logout');
    });
  } catch (error) {
    res.send(error.message);
  }
};

export const toggleUserRole = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await Customer.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }
    user.role = user.role === 'admin' ? 'user' : 'admin';
    await user.save();

    res.redirect("/");
  } catch (error) {
    res.status(500).send(error.message);
  }
};


export const logout = (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
}                        

export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
};

export const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).send('Access denied');
}


