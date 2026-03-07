import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, List, Typography, Spin, Empty, Avatar, Tag, Divider, Input, message } from 'antd';
import { ArrowLeftOutlined, LikeOutlined, LikeFilled, StarOutlined, StarFilled, UserOutlined } from '@ant-design/icons';
import { postApi } from '../../services/post';
import { commentApi } from '../../services/comment';
import useUserStore from '../../store/userStore';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function Post() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const { isLoggedIn, user } = useUserStore();

  useEffect(() => {
    loadPost();
    loadComments();
  }, [id]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const res = await postApi.get(id);
      if (res.success) setPost(res.data);
    } catch (error) {
      console.error('加载帖子失败:', error);
    }
    setLoading(false);
  };

  const loadComments = async () => {
    try {
      const res = await commentApi.list(id, { pageSize: 50 });
      if (res.success) setComments(res.data?.items || []);
    } catch (error) {
      console.error('加载评论失败:', error);
    }
  };

  const handleLike = async () => {
    if (!isLoggedIn) {
      message.warning('请先登录');
      return;
    }
    try {
      await postApi.like(id);
      loadPost();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await commentApi.create(id, { content: commentText });
      if (res.success) {
        message.success('评论成功');
        setCommentText('');
        loadComments();
      }
    } catch (error) {
      message.error('评论失败');
    }
  };

  return (
    <div className="post-page">
      <Link to="/">
        <Button icon={<ArrowLeftOutlined />}>返回</Button>
      </Link>

      <Spin spinning={loading}>
        {post && (
          <Card className="post-detail" style={{ marginTop: 16 }}>
            <div className="post-header">
              <Avatar src={post.author?.avatar} icon={<UserOutlined />} size={48} />
              <div className="author-info">
                <Text strong>{post.author?.username}</Text>
                <Text type="secondary">{new Date(post.createdAt).toLocaleString()}</Text>
              </div>
              {post.categoryName && <Tag color="blue">{post.categoryName}</Tag>}
            </div>
            <Divider />
            <Title level={3}>{post.title}</Title>
            <Paragraph className="post-content">{post.content}</Paragraph>
            <Divider />
            <div className="post-actions">
              <Button icon={<LikeOutlined />} onClick={handleLike}>
                点赞 ({post.likeCount || 0})
              </Button>
              <Button icon={<StarOutlined />}>
                收藏
              </Button>
              <Text type="secondary">浏览 {post.viewCount || 0}</Text>
            </div>
          </Card>
        )}

        <Card className="comment-section" style={{ marginTop: 16 }}>
          <Title level={4}>评论 ({comments.length})</Title>
          {isLoggedIn && (
            <div className="comment-input" style={{ marginBottom: 16 }}>
              <TextArea
                rows={3}
                placeholder="发表评论..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <Button type="primary" onClick={handleSubmitComment} style={{ marginTop: 8 }}>
                发表评论
              </Button>
            </div>
          )}
          <List
            dataSource={comments}
            renderItem={(comment) => (
              <List.Item>
                <div className="comment-item">
                  <Avatar src={comment.author?.avatar} icon={<UserOutlined />} />
                  <div className="comment-content">
                    <Text strong>{comment.author?.username}</Text>
                    <Paragraph>{comment.content}</Paragraph>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(comment.createdAt).toLocaleString()}
                    </Text>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>
      </Spin>
    </div>
  );
}