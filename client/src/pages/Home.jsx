import { Link } from 'react-router-dom';
import '../styles/Home.css';
import LeaderboardWidget from '../components/LeaderboardWidget.jsx';

const Home = () => {
  return (
    <div className="home-container">
      <div style={{textAlign: 'center', marginBottom: '2rem'}}>
        <h1>化学物质猜测测试</h1>
        <p style={{fontSize: '1.1rem', color: '#64748b', marginTop: '0.5rem'}}>
          通过属性猜测化学物质，学习高中化学知识
        </p>
      </div>

      <div className="game-modes" style={{display:'grid', gridTemplateColumns:'repeat(2, minmax(280px, 1fr))', gap:'24px', width:'100%', maxWidth: '1000px'}}>
        <Link to="/chemistry" className="mode-button chemistry-mode glass-card" style={{textDecoration:'none'}}>
          <h2>🧪 开始测试</h2>
          <small>根据提示猜测化学物质<br/>通过属性反馈逐步缩小范围</small>
        </Link>
        <LeaderboardWidget />
        <Link to="/library" className="mode-button glass-card" style={{textDecoration:'none'}}>
          <h2>📚 浏览题库</h2>
          <small>查看所有化学物质<br/>按无机物/有机物分组展示</small>
        </Link>
        <Link to="/records" className="mode-button glass-card" style={{textDecoration:'none'}}>
          <h2>🧾 测试记录</h2>
          <small>查看每次测试起止时间、答案、失败原因<br/>点击展开查看本次全部猜测</small>
        </Link>
      </div>
    </div>
  );
};

export default Home;
