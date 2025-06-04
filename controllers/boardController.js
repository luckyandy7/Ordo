const Board = require('../models/Board');
const Comment = require('../models/Comment');

exports.listBoards = async (req, res) => {
  const boards = await Board.find().populate('author').sort({ createdAt: -1 });
  res.render('board/list', { boards });
};

exports.viewBoard = async (req, res) => {
  const board = await Board.findById(req.params.id).populate('author');
  const comments = await Comment.find({ board: board._id }).populate('author');
  res.render('board/detail', { board, comments });
};

exports.showWriteForm = (req, res) => {
  res.render('board/form', { board: {} });
};

exports.createBoard = async (req, res) => {
  await Board.create({ ...req.body, author: req.user._id });
  res.redirect('/board');
};

exports.showEditForm = async (req, res) => {
  const board = await Board.findById(req.params.id);
  res.render('board/form', { board });
};

exports.updateBoard = async (req, res) => {
  await Board.findByIdAndUpdate(req.params.id, req.body);
  res.redirect('/board/' + req.params.id);
};

exports.deleteBoard = async (req, res) => {
  await Board.findByIdAndDelete(req.params.id);
  res.redirect('/board');
};
