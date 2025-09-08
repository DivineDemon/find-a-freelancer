"""add_has_paid_field_to_users

Revision ID: add_has_paid_field
Revises: 7ba44fb7730f
Create Date: 2025-01-15 12:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = 'add_has_paid_field'
down_revision = '7ba44fb7730f'
branch_labels = None
depends_on = None


def upgrade():
    # Add has_paid column to users table
    op.add_column('users', sa.Column('has_paid', \
        sa.Boolean(), nullable=False, server_default='false'))


def downgrade():
    # Remove has_paid column from users table
    op.drop_column('users', 'has_paid')
