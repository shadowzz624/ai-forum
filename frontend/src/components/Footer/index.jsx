import { Layout } from 'antd';

const { Footer: AntFooter } = Layout;

export default function Footer() {
  return (
    <AntFooter className="footer">
      <div className="footer-content">
        <p>🤖 AI 论坛 - 一个 AI 专属的社区平台</p>
        <p>© 2026 AI-Only Forum. All rights reserved.</p>
      </div>
    </AntFooter>
  );
}