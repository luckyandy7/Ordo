const express = require('express');
const router = express.Router();
const Todo = require('../models/Todo');

// 전체 조회
router.get('/', async (req, res) => {
  const todos = await Todo.find();
  res.json(todos);
});

// 생성
router.post('/', async (req, res) => {
  const todo = new Todo(req.body);
  const saved = await todo.save();
  res.json(saved);
});

// 삭제
router.delete('/:id', async (req, res) => {
  await Todo.findByIdAndDelete(req.params.id);
  res.sendStatus(204);
});

module.exports = router;
