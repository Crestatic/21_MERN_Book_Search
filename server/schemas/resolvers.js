const { AuthenticationError } = require('apollo-server-express');
const { User } = require("../models");
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        // get log in user info
        me: async (parent, args, context) => {
            if (context.user) {
                // if user id matches, return user
                const userId = await User.findOne({ _id: context.user._id }).select(
                    "-__v -password"
                );
                return userId;
            }
            // throw an error if there are no match
            throw new AuthenticationError("Please log in");
        },
    },

    Mutation: {
        login: async (parent, { email, password }) => {
            // find user with provided email
            const user = await User.findOne({ email });
            
            if (!user) {
                throw new AuthenticationError("No user found")
            }
            const correctPassword = await user.isCorrectPassword(password);
            if(!correctPassword) {
                throw new AuthenticationError("Incorrect Password");
            }
            const token = signToken(user);
            return { token, user };
        },
        addUser: async (parent, { username, email, password }) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, { savedBook }, context) => {
            if (context.user) {

                const user = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: { savedBooks: savedBook } },
                    { new: true, runValidators: true }
                );
                return user;
            } 
            throw new AuthenticationError("You must be logged in.");
        },
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const user = await User.findByIdAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: { bookId: bookId} } },
                    { new: true }
                );
                return user;
            }
            throw new AuthenticationError("You must be logged in.")
        }
    }
}

module.exports = resolvers;