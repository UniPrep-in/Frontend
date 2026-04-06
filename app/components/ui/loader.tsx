'use client';

import styled from 'styled-components';

type LoaderProps = {
  title?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
  showText?: boolean;
};

const DEFAULT_TITLE = 'Loading UniPrep';
const DEFAULT_SUBTITLE = 'Setting up your next step with a little sunshine.';

export default function Loader({
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  className,
  compact = false,
  showText = true,
}: LoaderProps) {
  return (
    <StyledWrapper $compact={compact} className={className}>
      <div className="shell" role="status" aria-live="polite" aria-busy="true">
        <div className="dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        {showText ? (
          <div className="copy">
            <p className="title">{title}</p>
            <p className="subtitle">{subtitle}</p>
          </div>
        ) : null}
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{ $compact: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  .shell {
    display: flex;
    width: ${({ $compact }) => ($compact ? "auto" : "min(100%, 19rem)")};
    flex-direction: column;
    align-items: center;
    gap: 1.1rem;
    border-radius: 2.4rem;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 247, 237, 0.98)),
      radial-gradient(circle at top, rgba(254, 243, 199, 0.7), transparent 60%);
    padding: ${({ $compact }) => ($compact ? "0" : "1.5rem 1.75rem")};
    box-shadow: ${({ $compact }) =>
      $compact
        ? "none"
        : "0 18px 45px rgba(245, 158, 11, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.9)"};
    text-align: center;
  }

  .dots {
    display: inline-flex;
    align-items: center;
    gap: ${({ $compact }) => ($compact ? "0.45rem" : "0.8rem")};
    padding: ${({ $compact }) => ($compact ? "0" : "0.9rem 1.1rem")};
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(255, 247, 237, 0.96), rgba(255, 237, 213, 0.92));
    box-shadow: ${({ $compact }) =>
      $compact
        ? "none"
        : "inset 0 1px 0 rgba(255, 255, 255, 0.88), 0 12px 28px rgba(251, 146, 60, 0.16)"};
  }

  .dots span {
    width: ${({ $compact }) => ($compact ? "0.5rem" : "1rem")};
    height: ${({ $compact }) => ($compact ? "0.5rem" : "1rem")};
    border-radius: 999px;
    background: linear-gradient(180deg, #fbbf24, #fb923c);
    box-shadow: ${({ $compact }) =>
      $compact ? "none" : "0 0 0 0.2rem rgba(255, 237, 213, 0.85)"};
    animation: bounceDot 1s ease-in-out infinite;
  }

  .dots span:nth-child(2) {
    animation-delay: 0.16s;
  }

  .dots span:nth-child(3) {
    animation-delay: 0.32s;
  }

  .copy {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .title {
    margin: 0;
    color: #7c2d12;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.01em;
  }

  .subtitle {
    margin: 0;
    color: #9a3412;
    font-size: 0.92rem;
    line-height: 1.5;
  }

  @keyframes bounceDot {
    0%,
    100% {
      transform: translateY(0);
      opacity: 0.6;
    }

    50% {
      transform: translateY(-0.3rem);
      opacity: 1;
    }
  }
`;
