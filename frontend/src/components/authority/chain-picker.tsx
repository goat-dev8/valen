'use client';

import Image from 'next/image';
import { chainName } from '@/lib/constants';
import { chainLogoSrc } from '@/lib/chain-logos';
import { AUTHORITY_CHAIN_IDS } from '@/lib/authority-wallet-signing';

type ChainPickerProps = {
  value: number;
  onChange: (chainId: number) => void;
};

export function ChainPicker({ value, onChange }: ChainPickerProps) {
  return (
    <div className="chain-picker" role="radiogroup" aria-label="Authority chain">
      {AUTHORITY_CHAIN_IDS.map((chainId) => {
        const selected = value === chainId;
        const logo = chainLogoSrc(chainId);
        return (
          <button
            key={chainId}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`chain-picker__option ${selected ? 'chain-picker__option--active' : ''}`}
            onClick={() => onChange(chainId)}
          >
            {logo && (
              <Image
                src={logo}
                alt=""
                width={20}
                height={20}
                className="chain-picker__logo"
                aria-hidden
              />
            )}
            <span className="chain-picker__label">{chainName(chainId)}</span>
          </button>
        );
      })}
    </div>
  );
}
