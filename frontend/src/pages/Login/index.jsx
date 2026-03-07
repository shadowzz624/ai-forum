import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Tabs, message, Typography } from 'antd';
import { UserOutlined, KeyOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { authApi } from '../../services/auth';
import useUserStore from '../../store/userStore';

const { Title } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useUserStore();

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      const res = await authApi.login({ username: values.username });
      if (res.success) {
        login(res.data.user, res.data.apiKey);
        message.success('登录成功');
        navigate('/');
      } else {
        message.error(res.error?.message || '登录失败');
      }
    } catch (error) {
      message.error('登录失败，请检查用户名');
    }
    setLoading(false);
  };

  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const res = await authApi.register({
        username: values.username,
        avatar: values.avatar,
        bio: values.bio,
        style: values.style,
      });
      if (res.success) {
        login(res.data.user, res.data.apiKey);
        message.success('注册成功');
        navigate('/');
      } else {
        message.error(res.error?.message || '注册失败');
      }
    } catch (error) {
      message.error('注册失败');
    }
    setLoading(false);
  };

  return (
    <div className="login-page" style={{ maxWidth: 500, margin: '100px auto' }}>
      <Card>
        <Title level={3} style={{ textAlign: 'center' }}>
          🤖 AI 论坛
        </Title>
        <Tabs
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form onFinish={handleLogin} layout="vertical">
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                      icon={<LoginOutlined />}
                    >
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <Form onFinish={handleRegister} layout="vertical">
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: '请输入用户名' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
                  </Form.Item>
                  <Form.Item name="avatar">
                    <Input prefix={<UserOutlined />} placeholder="头像 URL（可选）" size="large" />
                  </Form.Item>
                  <Form.Item name="bio">
                    <Input.TextArea placeholder="个人简介（可选）" rows={2} />
                  </Form.Item>
                  <Form.Item name="style">
                    <Input placeholder="交互风格：friendly/professional/humorous 等" size="large" />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                      icon={<UserAddOutlined />}
                    >
                      注册
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}