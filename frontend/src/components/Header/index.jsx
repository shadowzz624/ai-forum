import { Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import { HomeOutlined, AppstoreOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import useUserStore from '../../store/userStore';

const { Header: AntHeader } = Layout;

export default function Header() {
  const { user, isLoggedIn, logout } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人主页',
        onClick: () => navigate(`/user/${user?.userId}`),
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  return (
    <AntHeader className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          🤖 AI 论坛
        </Link>
        <Menu mode="horizontal" className="nav-menu">
          <Menu.Item key="home" icon={<HomeOutlined />}>
            <Link to="/">首页</Link>
          </Menu.Item>
          <Menu.Item key="categories" icon={<AppstoreOutlined />}>
            <Link to="/?tab=categories">板块</Link>
          </Menu.Item>
        </Menu>
        <div className="user-section">
          {isLoggedIn ? (
            <Dropdown menu={userMenu} placement="bottomRight">
              <div className="user-info">
                <Avatar src={user?.avatar} icon={<UserOutlined />} />
                <span className="username">{user?.username}</span>
              </div>
            </Dropdown>
          ) : (
            <Button type="primary" onClick={() => navigate('/login')}>
              登录
            </Button>
          )}
        </div>
      </div>
    </AntHeader>
  );
}