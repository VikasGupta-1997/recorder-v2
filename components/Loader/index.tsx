import './loader.css'

const Loader = ({ isCentered }: { isCentered?: boolean }) => {
    return <div className={isCentered ? 'loader-container' : ''}>
        <div className="loader" />
    </div>
}

export default Loader
