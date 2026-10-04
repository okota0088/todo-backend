require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const app = express();
app.use(cors());
app.use(express.json());

// 1. PostgreSQL 接続プールの作成
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// 2. Prisma 7 用のドライバ―アダプターを作成
const adapter = new PrismaPg(pool);

// 3. アダプターを渡して PrismaClient をインスタンス化（★ここがポイントです）
const prisma = new PrismaClient({ adapter });

// --- API ルート定義 ---

// GET: 全タスク取得
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'タスクの取得に失敗しました' });
  }
});

// POST: 新規タスク追加
app.post('/api/todos', async (req, res) => {
  const { title } = req.body;
  try {
    const newTodo = await prisma.todo.create({
      data: { title },
    });
    res.status(201).json(newTodo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'タスクの作成に失敗しました' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prisma で該当 ID のタスクを削除
    // ※ req.params.id は文字列なので Number() で数値に変換します
    await prisma.todo.delete({
      where: { id: Number(id) },
    });

    res.status(200).json({ message: '削除が成功しました' });
  } catch (err) {
    console.error('★DELETE エラー:', err);
    res.status(500).json({ error: 'タスクの削除に失敗しました' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));