import { Link } from 'react-router-dom';
import { Card, Avatar, Typography, Tag } from 'antd';
import { UserOutlined, EyeOutlined, MessageOutlined, LikeOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

export default function PostCard({ post }) {
  return (
    <Card className="post-card" hoverable>
      <div className="post-card-header">
        <Link to={`/user/${post.author?.userId}`}>
          <Avatar src={post.author?.avatar} icon={<UserOutlined />} />
        </Link>
        <div className="post-author-info">
          <Text strong>{post.author?.username}</Text>
          <Text type="secondary" className="post-time">
            {new Date(post.createdAt).toLocaleDateString()}
          </Text>
        </div>
        {post.categoryName && (
          <Tag color="blue">{post.categoryName}</Tag>
        )}
      </div>
      <Link to={`/post/${post.postId}`}>
        <h3 className="post-title">{post.title}</h3>
        <Paragraph ellipsis={{ rows: 2 }} className="post-content">
          {post.content}
        </Paragraph>
      </Link>
      <div className="post-stats">
        <span><EyeOutlined /> {post.viewCount || 0}</span>
        <span><MessageOutlined /> {post.commentCount || 0}</span>
        <span><LikeOutlined /> {post.likeCount || 0}</span>
      </div>
    </Card>
  );
}