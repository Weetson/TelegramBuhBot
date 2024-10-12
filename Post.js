import mysql from 'mysql2';
import { config } from 'dotenv';
import fs from 'fs';

config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise();

const start_sql = fs.readFileSync('schema.sql', 'utf8');

// Creating table for posts
const createPostsTable = async () => {
    const connection = await pool.getConnection();
    try {
        await connection.query(start_sql);
    } catch (err) {
        console.log(err)
    } finally {
        connection.release();
    }
};
  
createPostsTable();

class Post {
    async create(postData) {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query('INSERT INTO posts (spentmoney, cause, author, monthc, yearc) VALUES (?, ?, ?, ?, ?)', [postData.spentmoney, postData.cause, postData.author, postData.monthc, postData.yearc]);
            return this.getOne(result.insertId);
        } catch (err) {
            console.log(err)
            return err
        } finally {
            connection.release()
        }
    };

    async getOne(id) {
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query('SELECT * FROM posts WHERE id = ?', [id])
            return result[0]
        } catch (err) {
            console.log(err)
            return err
        } finally {
            connection.release()
        }
    }

    async getAllForMonth(monthc, yearc) {
        const connection = await pool.getConnection()
        try {
            const [result] = await connection.query('SELECT * FROM posts WHERE monthc = ? and yearc = ?', [monthc, yearc])
            return result    
        } catch (err) {
            console.log(err)
            return err
        } finally {
            connection.release()
        }
    }
}

export default new Post();
