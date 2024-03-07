import { Strategy as LocalStrategy } from 'passport-local';
import Customer from '../models/Customer.js';

export default function(passport) {
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await Customer.findOne({ username });
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }

      user.comparePassword(password, (err, isMatch) => {
        if (err) throw err;
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Incorrect password.' });
        }
      });
    } catch (error) {
      return done(error);
    }
  }));

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await Customer.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}
