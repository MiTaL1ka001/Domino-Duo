import React from 'react';
import { Tile } from '@domino-duo/shared';
import { Modal } from '../common/Modal';
import { DominoTile } from '../tile/DominoTile';
import { Button } from '../common/Button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface EndPickerModalProps {
  isOpen: boolean;
  tile: Tile | null;
  leftEndVal: number | null;
  rightEndVal: number | null;
  onChooseEnd: (end: 'left' | 'right') => void;
  onCancel: () => void;
}

export const EndPickerModal: React.FC<EndPickerModalProps> = ({
  isOpen,
  tile,
  leftEndVal,
  rightEndVal,
  onChooseEnd,
  onCancel
}) => {
  if (!tile) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Choose Placement End">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          textAlign: 'center'
        }}
      >
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#a7f3d0' }}>
          This tile matches both ends of the domino chain. Choose which end you want to connect to:
        </p>

        {/* Tile Preview */}
        <div style={{ padding: '8px' }}>
          <DominoTile tile={tile} orientation="horizontal" size="lg" />
        </div>

        {/* Choice Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', width: '100%' }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={<ArrowLeft size={18} />}
            onClick={() => onChooseEnd('left')}
          >
            Left End ({leftEndVal})
          </Button>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={<ArrowRight size={18} />}
            onClick={() => onChooseEnd('right')}
          >
            Right End ({rightEndVal})
          </Button>
        </div>

        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
};
